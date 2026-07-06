import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Check, X, AlertTriangle, Info, Clock, ShieldAlert, Zap } from 'lucide-react';
import { useEnterpriseStore } from '../../../store/useEnterpriseStore';
import { brainService } from '../../../services/brainService';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Recommendation } from '../../../types/hospital';

export default function HospitalBrainDashboard() {
  const { recommendations, updateRecommendationStatus } = useEnterpriseStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Diagnostics will only run when manually triggered

  const handleAction = async (id: string, action: 'Approved' | 'Rejected' | 'Ignored') => {
    await updateRecommendationStatus(id, action);
    const { addWorkflow, addEmail } = useEnterpriseStore.getState();
    const rec = recommendations.find(r => r.id === id);

    if (action === 'Approved' && rec) {
      // 1. Spin up an automated workflow
      await addWorkflow({
        id: crypto.randomUUID(),
        name: `Implement: ${rec.title}`,
        triggerEvent: 'Admin Approved',
        status: 'Running',
        steps: [
          { id: crypto.randomUUID(), name: 'Initialize', status: 'Completed', agent: 'System' },
          { id: crypto.randomUUID(), name: 'Execute Action', status: 'Running', agent: 'Automation' }
        ],
        createdAt: new Date().toISOString()
      });

      // 2. Dispatch an email
      await addEmail({
        id: crypto.randomUUID(),
        subject: `[AI ACTION] ${rec.title} Approved`,
        recipient: `${rec.department.toLowerCase().replace(' ', '')}_head@hospitalos.local`,
        status: 'Delivered',
        template: 'action_approval',
        content: `Automated Action Approved:\n\nInsight: ${rec.title}\nReason: ${rec.reason}\nAction: ${rec.suggestedAction}\n\nA new workflow has been spun up to track progress.`,
        createdAt: new Date().toISOString()
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-500/20 text-red-500 border-red-500/50';
      case 'High': return 'bg-orange-500/20 text-orange-500 border-orange-500/50';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      default: return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
    }
  };

  const pendingRecs = recommendations.filter(r => r.status === 'Pending');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
            <BrainCircuit className="w-7 h-7 md:w-8 md:h-8 text-primary" />
            Hospital Brain
          </h1>
          <p className="text-muted-foreground mt-1">Autonomous Central Intelligence Supervisor</p>
        </div>
        <Button 
          onClick={async () => {
            setIsAnalyzing(true);
            await brainService.runDiagnostics();
            setTimeout(() => setIsAnalyzing(false), 800);
          }}
          disabled={isAnalyzing}
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto min-h-[48px]"
        >
          {isAnalyzing ? (
            <><Zap className="w-4 h-4 mr-2 animate-pulse" /> Scanning Network...</>
          ) : (
            <><BrainCircuit className="w-4 h-4 mr-2" /> Run Diagnostics</>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-card/50 border border-border p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="font-semibold text-foreground">Critical Alerts</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {pendingRecs.filter(r => r.priority === 'Critical').length}
          </p>
        </div>
        <div className="bg-card/50 border border-border p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <Info className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-foreground">Active Insights</h3>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {pendingRecs.length}
          </p>
        </div>
        <div className="bg-card/50 border border-border p-6 rounded-2xl">
          <div className="flex items-center gap-3 text-muted-foreground mb-2">
            <ShieldAlert className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold text-foreground">System Health</h3>
          </div>
          <p className="text-3xl font-bold text-green-400">Stable</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Recommended Actions</h2>
        
        {pendingRecs.length === 0 ? (
          <div className="bg-card/50 border border-border rounded-2xl p-12 text-center text-muted-foreground">
            <BrainCircuit className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>System is running optimally. No new recommendations.</p>
          </div>
        ) : (
          <AnimatePresence>
            {pendingRecs.map((rec, idx) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-lg"
              >
                <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge className={getPriorityColor(rec.priority)}>
                        {rec.priority} Priority
                      </Badge>
                      <Badge variant="outline" className="text-primary border-primary/50">
                        {rec.confidenceScore}% Confidence
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(rec.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{rec.title}</h3>
                      <p className="text-muted-foreground mt-1">{rec.reason}</p>
                    </div>

                    <div className="bg-background/50 rounded-lg p-3 border border-border/50">
                      <p className="text-sm text-foreground">
                        <span className="text-primary font-semibold mr-2">Suggested Action:</span>
                        {rec.suggestedAction}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                    <Button 
                      onClick={() => handleAction(rec.id, 'Approved')}
                      className="bg-green-500/20 text-green-500 hover:bg-green-500/30 w-full"
                    >
                      <Check className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleAction(rec.id, 'Ignored')}
                      className="w-full"
                    >
                      Ignore
                    </Button>
                    <Button 
                      variant="ghost"
                      onClick={() => handleAction(rec.id, 'Rejected')}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10 w-full"
                    >
                      <X className="w-4 h-4 mr-2" /> Reject
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
