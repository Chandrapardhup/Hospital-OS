import { useEnterpriseStore } from '../store/useEnterpriseStore';
import type { Workflow, WorkflowStep } from '../types/hospital';
import { toast } from 'sonner';

// Helper to simulate agent execution time
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const workflowService = {
  triggerWorkflow: async (name: string, triggerEvent: string, initialSteps: Omit<WorkflowStep, 'id'>[]) => {
    const { addWorkflow, updateWorkflow } = useEnterpriseStore.getState();

    const steps: WorkflowStep[] = initialSteps.map((step, idx) => ({
      ...step,
      id: `step_${idx}_${Date.now()}`
    }));

    const workflow: Workflow = {
      id: `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      triggerEvent,
      status: 'Running',
      steps,
      createdAt: new Date().toISOString()
    };

    // Add to state and DB
    await addWorkflow(workflow);
    toast.info(`Workflow Started: ${name}`);
    
    // Execute steps sequentially in background
    let failed = false;
    const startTime = Date.now();

    for (let i = 0; i < steps.length; i++) {
      if (failed) break;

      const step = steps[i];
      // Mark current step as running
      steps[i].status = 'Running';
      await updateWorkflow(workflow.id, { steps: [...steps] });
      toast.loading(`Running: ${step.name}`, { id: workflow.id });

      try {
        // Simulate step execution (in a real app, this would call actual endpoints/services)
        await delay(1500 + Math.random() * 1000); 
        
        steps[i].status = 'Completed';
        steps[i].executionTimeMs = Date.now() - startTime;
        toast.success(`Completed: ${step.name}`, { id: workflow.id });
      } catch (err: any) {
        steps[i].status = 'Failed';
        steps[i].error = err.message;
        failed = true;
        toast.error(`Failed: ${step.name}`, { id: workflow.id });
      }

      await updateWorkflow(workflow.id, { steps: [...steps] });
      
      // Delay before next step for visual effect
      await delay(500);
    }

    await updateWorkflow(workflow.id, { 
      status: failed ? 'Failed' : 'Completed',
      executionTimeMs: Date.now() - startTime
    });
    
    if (!failed) {
      toast.success(`Workflow Completed: ${name}`, { id: workflow.id });
      
      // Perform actual side-effects based on the workflow name
      const store = (await import('../store/useHospitalStore')).useHospitalStore.getState();
      
      if (name === 'Emergency Admission Protocol') {
        const newPatientId = `pat_emg_${Date.now()}`;
        await store.addPatient({
          id: newPatientId,
          name: 'Jane Doe (Emergency)',
          email: 'emergency@example.com',
          phone: '555-0100',
          dob: '1985-06-15',
          gender: 'Female',
          bloodGroup: 'O-',
          address: 'Ambulance Intake',
          status: 'Emergency'
        });
        
        if (store.doctors.length > 0) {
          await store.addAppointment({
            id: `apt_emg_${Date.now()}`,
            patientId: newPatientId,
            doctorId: store.doctors[0].id,
            date: new Date().toISOString().split('T')[0],
            time: 'Immediate',
            type: 'Emergency',
            status: 'Waiting',
            symptoms: 'Severe trauma, immediate attention required.'
          });
        }
        
        toast.success('Patient "Jane Doe (Emergency)" added to system & assigned to doctor.');
      } 
      
      else if (name === 'Stat Lab Report Dispatch') {
        if (store.patients.length > 0) {
          const patient = store.patients[0];
          await store.addMedicalRecord({
            id: `rec_lab_${Date.now()}`,
            patientId: patient.id,
            title: 'STAT Complete Blood Count',
            sub: 'Critical Values Flagged',
            fileUrl: '#'
          });
          
          if (patient.assignedDoctorId) {
            await store.addNotification({
              userId: patient.assignedDoctorId,
              title: 'CRITICAL LAB RESULTS',
              message: `Critical values detected in STAT labs for ${patient.name}. Immediate review required.`,
              type: 'error'
            });
          }
          
          toast.success(`STAT Lab Results attached to ${patient.name}'s record.`);
        }
      }
      
      else if (name === 'Pre-Surgery Clearance Protocol') {
        // Decrease blood inventory for surgery prep
        const bloodBags = store.inventory.find(i => i.name.toLowerCase().includes('blood') || i.category.toLowerCase().includes('blood'));
        if (bloodBags && bloodBags.quantity > 0) {
          store.updateInventoryItem(bloodBags.id, { quantity: bloodBags.quantity - 1 });
          toast.info(`Inventory: 1 unit of Blood reserved for surgery.`);
        }
        
        if (store.patients.length > 0) {
          await store.updatePatient(store.patients[0].id, { status: 'Admitted' });
          toast.success(`Patient ${store.patients[0].name} status updated to Admitted for surgery.`);
        }
      }
    }
  }
};
