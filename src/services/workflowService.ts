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
      
      if (name === 'Mass Emergency Intake') {
        const doc = store.doctors.length > 0 ? store.doctors[0] : null;
        
        for (let i = 1; i <= 3; i++) {
          const newPatientId = `pat_emg_${Date.now()}_${i}`;
          await store.addPatient({
            id: newPatientId,
            name: `Mass Casualty Patient ${i}`,
            email: `trauma${i}@example.com`,
            phone: '555-0000',
            dob: '1990-01-01',
            gender: 'Unknown',
            bloodGroup: 'O-',
            address: 'Incident Site',
            status: 'Emergency'
          });
          
          if (doc) {
            await store.addAppointment({
              id: `apt_emg_${Date.now()}_${i}`,
              patientId: newPatientId,
              doctorId: doc.id,
              date: new Date().toISOString().split('T')[0],
              time: 'Immediate',
              type: 'Emergency',
              status: 'Waiting',
              symptoms: 'Mass casualty trauma incident.'
            });
          }
        }
        toast.success('3 Emergency Patients admitted and queued instantly.');
      } 
      
      else if (name === 'Autonomous Inventory Restock') {
        let restockedCount = 0;
        store.inventory.forEach(item => {
          if (item.quantity <= item.min_stock_level) {
            store.updateInventoryItem(item.id, { quantity: 500, status: 'In Stock' });
            restockedCount++;
          }
        });
        
        if (restockedCount > 0) {
          toast.success(`${restockedCount} low-stock inventory items were automatically restocked to 500 units.`);
        } else {
          toast.info('All inventory was already sufficiently stocked.');
        }
      }
      
      else if (name === 'End of Day Revenue Settlement') {
        for (let i = 1; i <= 5; i++) {
          await store.addInvoice({
            id: `INV-AUTO-${Date.now()}-${i}`,
            patientId: store.patients.length > 0 ? store.patients[0].id : 'N/A',
            doctorId: store.doctors.length > 0 ? store.doctors[0].id : 'N/A',
            amount: 25000 + Math.floor(Math.random() * 50000), // Massive revenue spike (25k-75k)
            status: 'Paid',
            date: new Date().toISOString(),
            items: [{ description: 'Complex Surgical Procedure', quantity: 1, price: 50000 }]
          });
        }
        toast.success('5 major surgery invoices have been paid, drastically spiking hospital revenue.');
      }
    }
  }
};
