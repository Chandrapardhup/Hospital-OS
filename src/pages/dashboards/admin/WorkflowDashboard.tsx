import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, CheckCircle2, CircleDashed, XCircle, Loader2, Play, Activity, TestTube, Scissors } from 'lucide-react';
import { useEnterpriseStore } from '../../../store/useEnterpriseStore';
import { workflowService } from '../../../services/workflowService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { WorkflowStatus } from '../../../types/hospital';

const WORKFLOW_TEMPLATES = [
  {
    id: 'wf-1',
    name: 'Emergency Admission Protocol',
    icon: Activity,
    description: 'Instantly coordinates emergency response by alerting trauma team, securing an ICU bed, and notifying reception.',
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    steps: [
      { name: 'Update Emergency Queue', status: 'Pending', agent: 'Reception Agent' },
      { name: 'Assign Available Trauma Doctor', status: 'Pending', agent: 'Doctor Assistant Agent' },
      { name: 'Reserve ICU Bed', status: 'Pending', agent: 'Facilities Agent' },
      { name: 'Alert Shift Administrator', status: 'Pending', agent: 'Supervisor Agent' }
    ]
  },
  {
    id: 'wf-2',
    name: 'Stat Lab Report Dispatch',
    icon: TestTube,
    description: 'Automatically processes high-priority lab results and routes them directly to the attending physician for review.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    steps: [
      { name: 'Retrieve Lab Results', status: 'Pending', agent: 'Laboratory System' },
      { name: 'Flag Abnormal Values', status: 'Pending', agent: 'Diagnostic AI' },
      { name: 'Page Attending Doctor', status: 'Pending', agent: 'Notification Agent' },
      { name: 'Log in Medical Record', status: 'Pending', agent: 'Records Agent' }
    ]
  },
  {
    id: 'wf-3',
    name: 'Pre-Surgery Clearance Protocol',
    icon: Scissors,
    description: 'Runs a comprehensive checklist for surgical candidates, verifying consent, blood type availability, and fasting status.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    steps: [
      { name: 'Verify Surgical Consent', status: 'Pending', agent: 'Compliance Agent' },
      { name: 'Check Blood Bank Reserves', status: 'Pending', agent: 'Inventory Agent' },
      { name: 'Confirm Fasting Status', status: 'Pending', agent: 'Nurse Station' },
      { name: 'Clear for OR Transfer', status: 'Pending', agent: 'Surgical Coordinator' }
    ]
  }
];

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

  const handleRunWorkflow = (template: typeof WORKFLOW_TEMPLATES[0]) => {
    workflowService.triggerWorkflow(
      template.name,
      'System Triggered Manually',
      template.steps.map(s => ({ ...s }))
    );
  };

  const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId) || workflows[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <Network className="w-7 h-7 md:w-8 md:h-8 text-primary" />
            AI Workflow Engine
          </h1>
          <p className="text-muted-foreground mt-1">Trigger and monitor autonomous multi-agent operational protocols</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {WORKFLOW_TEMPLATES.map(template => (
          <div key={template.id} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-3 rounded-lg ${template.bg}`}>
                  <template.icon className={`w-6 h-6 ${template.color}`} />
                </div>
                <h3 className="font-bold text-foreground leading-tight">{template.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
            </div>
            <Button 
              onClick={() => handleRunWorkflow(template)} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mt-4"
            >
              <Play className="w-4 h-4 mr-2" /> Run Protocol
            </Button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mt-8">
        <div className="lg:col-span-1 bg-card/50 border border-border rounded-2xl overflow-hidden flex flex-col h-auto lg:h-[500px]">
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
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(wf.startedAt).toLocaleTimeString()}</span>
                    <Badge variant="secondary" className={`${getStatusColor(wf.status)} border bg-transparent font-medium`}>
                      {wf.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-4 md:p-6 lg:h-[500px] flex flex-col">
          {selectedWorkflow ? (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-border">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selectedWorkflow.name}</h2>
                  <p className="text-muted-foreground mt-1">ID: {selectedWorkflow.id}</p>
                </div>
                <Badge variant="secondary" className={`text-sm px-3 py-1 ${getStatusColor(selectedWorkflow.status)}`}>
                  {selectedWorkflow.status}
                </Badge>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                <div className="relative">
                  <div className="absolute left-[21px] top-4 bottom-4 w-px bg-border/50"></div>
                  <div className="space-y-6">
                    <AnimatePresence>
                      {selectedWorkflow.steps.map((step, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={step.id} 
                          className="relative pl-14"
                        >
                          <div className="absolute left-0 top-1.5 p-1 rounded-full bg-background border border-border shadow-sm">
                            {getStatusIcon(step.status)}
                          </div>
                          <div className={`p-4 rounded-xl border transition-colors ${
                            step.status === 'Running' ? 'bg-primary/5 border-primary/30' : 'bg-muted/30 border-border'
                          }`}>
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-semibold text-foreground">{step.name}</h4>
                              <span className="text-xs font-medium text-muted-foreground bg-background px-2 py-1 rounded-md border border-border shadow-sm">
                                Agent: {step.agent}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">AI is processing this task autonomously.</p>
                            <Badge variant="outline" className={getStatusColor(step.status)}>
                              {step.status}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Network className="w-16 h-16 opacity-20 mb-4" />
              <p className="text-lg">Select a workflow to view execution details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
