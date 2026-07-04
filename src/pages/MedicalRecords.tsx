import React, { useState } from "react";
import { Upload, FileText, Sparkles, Loader2, X } from "lucide-react";
import * as Dialog from '@radix-ui/react-dialog';
import { UploadDocumentModal } from '../components/UploadDocumentModal';
import { AIService } from '../services/AIService';
import { useHospitalStore } from '../store/useHospitalStore';

export default function MedicalRecords() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [explainingReport, setExplainingReport] = useState<string | null>(null);
  
  const records = useHospitalStore(state => state.medicalRecords);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <span>Administrator</span>
          <span className="text-foreground/20">•</span>
          <span className="text-primary">Command Center</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Medical Records</h1>
            <p className="text-sm text-muted-foreground mt-1">Longitudinal health graph · 128,410 documents indexed</p>
          </div>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border hover:bg-muted text-foreground font-medium rounded-xl transition-all"
          >
            <Upload className="w-4 h-4" /> Upload document
          </button>
        </div>
      </div>

      {/* AI Chart Assistant Box */}
      <div className="mt-8 bg-primary/5 border border-primary/20 rounded-2xl p-6 backdrop-blur-sm">
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">AI CHART ASSISTANT</p>
        <p className="text-sm text-foreground/90">
          Ask anything about a patient's chart — "summarize Elena Vance's last 6 months" or "flag interactions between metformin and any active medication".
        </p>
      </div>

      {/* Records List */}
      <div className="space-y-3 mt-6">
        {records.length === 0 ? (
          <div className="text-center py-10 bg-card/30 rounded-xl border border-border/50">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No medical records uploaded yet.</p>
          </div>
        ) : (
          records.map((record) => (
            <div key={record.id} className="bg-card/30 border border-border/50 hover:border-border hover:bg-muted rounded-xl p-5 flex items-center justify-between backdrop-blur-sm transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{record.title}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{record.sub}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {record.fileUrl && (
                  <a 
                    href={record.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:border-primary/50 text-xs font-medium text-foreground transition-all group-hover:bg-background"
                  >
                    View Image
                  </a>
                )}
                <button 
                  onClick={() => setExplainingReport(record.title)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/10 hover:bg-primary/20 text-xs font-bold text-primary transition-all shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Explain
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <UploadDocumentModal 
        open={isUploadModalOpen} 
        onOpenChange={setIsUploadModalOpen} 
      />

      <ExplainReportModal 
        reportTitle={explainingReport} 
        open={explainingReport !== null} 
        onOpenChange={(o) => !o && setExplainingReport(null)} 
      />
    </div>
  );
}

function ExplainReportModal({ reportTitle, open, onOpenChange }: { reportTitle: string | null, open: boolean, onOpenChange: (o: boolean) => void }) {
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (open && reportTitle) {
      const fetchExplanation = async () => {
        setIsLoading(true);
        // Mocking RAG chunk retrieval of report text
        const mockReportContent = `Extracted text from ${reportTitle}: Patient shows elevated blood glucose of 245 mg/dL. HDL is 38 mg/dL. LDL is 145 mg/dL. Triglycerides 210 mg/dL. Recommendation: Follow up for metabolic panel in 3 weeks.`;
        const res = await AIService.explainMedicalReport(mockReportContent);
        setExplanation(res);
        setIsLoading(false);
      };
      fetchExplanation();
    } else {
      setExplanation('');
    }
  }, [open, reportTitle]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl p-6 z-50">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> AI Report Explainer
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground border-b border-border/50 pb-2">Explaining: <span className="text-foreground">{reportTitle}</span></p>
            
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl min-h-[150px]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-sm">RAG Retrieving report data & generating explanation...</p>
                </div>
              ) : (
                <div className="text-sm text-foreground space-y-2 whitespace-pre-wrap">
                  {explanation}
                </div>
              )}
            </div>
            
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest text-center">
              Generated by Medical Records Agent • Do not use for self-diagnosis
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
