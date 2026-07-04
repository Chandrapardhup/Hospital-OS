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
    }
  }
};
