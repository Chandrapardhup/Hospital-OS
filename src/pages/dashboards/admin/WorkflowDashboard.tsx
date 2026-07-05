import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, CheckCircle2, CircleDashed, XCircle, Loader2, Play } from 'lucide-react';
import { useEnterpriseStore } from '../../../store/useEnterpriseStore';
import { workflowService } from '../../../services/workflowService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { WorkflowStatus } from '../../../types/hospital';

export default function WorkflowDashboard() {
  const { workflows } = useEnterpriseStore();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  const getStatusIcon = (status: WorkflowStatus) => {
    switch(status) {
      case 'Completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'Running': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'Failed': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <CircleDashed className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: WorkflowStatus) => {
    switch(status) {
      case 'Completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Running': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Failed': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId) || workflows[0];

  const handleTestWorkflow = () => {
    workflowService.triggerWorkflow(
      'Emergency Admission Protocol',
      'Patient Admitted to Emergency',
      [
        { name: 'Update Emergency Queue', status: 'Pending', agent: 'Reception Agent' },
        { name: 'Assign Available Doctor', status: 'Pending', agent: 'Doctor Assistant Agent' },
        { name: 'Reserve ICU Bed', status: 'Pending', agent: 'Facilities Agent' },
        { name: 'Alert Administrator', status: 'Pending', agent: 'Supervisor Agent' },
        { name: 'Queue Email Notification', status: 'Pending', agent: 'Notification Agent' },
      ]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Network className="w-7 h-7 md:w-8 md:h-8 text-primary" />
            Workflow Engine
          </h1>
          <p className="text-muted-foreground mt-1">Autonomous multi-agent task execution monitoring</p>
        </div>
        <Button onClick={handleTestWorkflow} className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto min-h-[48px]">
          <Play className="w-4 h-4 mr-2" /> Simulate Workflow
        </Button>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 mb-2">
        <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
          <Network className="w-4 h-4" /> What are HospitalOS Workflows?
        </h3>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Workflows orchestrate complex medical and administrative processes by automatically triggering chains of tasks. 
          When an event occurs (like an Emergency Admission), our AI agents coordinate to assign doctors, reserve beds, and notify staff in real-time. 
          This eliminates manual paperwork and ensures critical operations happen instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Workflow List */}
        <div className="lg:col-span-1 bg-card/50 border border-border rounded-2xl overflow-hidden flex flex-col h-auto lg:h-[600px]">
          <div className="p-4 border-b border-border bg-card/80 backdrop-blur-md">
            <h2 className="font-semibold text-foreground">Recent Executions</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {workflows.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <Network className="w-8 h-8 mx-auto mb-3 opacity-50" />
                No workflows executed yet.
              </div>
            ) : (
              workflows.map((wf) => (
                <div 
                  key={wf.id}
                  onClick={() => setSelectedWorkflowId(wf.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedWorkflow?.id === wf.id 
                      ? 'bg-primary/10 border-primary/30' 
                      : 'bg-background hover:bg-muted/50 border-border'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-foreground line-clamp-1">{wf.name}</h3>
                    {getStatusIcon(wf.status)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(wf.createdAt).toLocaleTimeString()}</span>
                    <span>•</span>
                    <span className="truncate">{wf.triggerEvent}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Workflow Details (Timeline) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-4 md:p-6 min-h-[400px] lg:min-h-[600px]">
          {selectedWorkflow ? (
            <div>
              <div className="flex justify-between items-start mb-8 pb-6 border-b border-border">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">{selectedWorkflow.name}</h2>
                  <p className="text-muted-foreground flex items-center gap-2">
                    Triggered by: <Badge variant="secondary">{selectedWorkflow.triggerEvent}</Badge>
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={getStatusColor(selectedWorkflow.status)} variant="outline">
                    {selectedWorkflow.status}
                  </Badge>
                  {selectedWorkflow.executionTimeMs && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Duration: {(selectedWorkflow.executionTimeMs / 1000).toFixed(2)}s
                    </p>
                  )}
                </div>
              </div>

              <div className="relative pl-6 space-y-8">
                {/* Vertical Line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border rounded-full" />
                
                {selectedWorkflow.steps.map((step, idx) => (
                  <motion.div 
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative"
                  >
                    <div className="absolute -left-6 top-1 bg-card rounded-full">
                      {getStatusIcon(step.status)}
                    </div>
                    <div className={`p-4 rounded-xl border transition-all ${
                      step.status === 'Running' ? 'bg-primary/5 border-primary/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'bg-background border-border'
                    }`}>
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold text-foreground">{step.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {step.agent}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{step.status}</span>
                        {step.executionTimeMs && (
                          <span className="text-muted-foreground">{step.executionTimeMs}ms</span>
                        )}
                      </div>
                      {step.error && (
                        <div className="mt-2 text-sm text-red-500 bg-red-500/10 p-2 rounded-lg">
                          Error: {step.error}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Network className="w-16 h-16 mb-4 opacity-20" />
              <p>Select a workflow to view execution timeline</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
