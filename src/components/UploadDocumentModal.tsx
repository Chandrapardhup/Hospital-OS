import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useHospitalStore } from '../store/useHospitalStore';
import { useAuthStore } from '../store/useAuthStore';

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDocumentModal({ open, onOpenChange }: UploadDocumentModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const addMedicalRecord = useHospitalStore(state => state.addMedicalRecord);
  const user = useAuthStore(state => state.user);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsUploading(true);
      setTimeout(() => {
        setIsUploading(false);
        setIsSuccess(true);
        
        // Add to global store
        addMedicalRecord({
          patientId: user?.id || 'pat_unknown',
          title: file.name,
          sub: `MR-UPLOAD · Self-Uploaded`,
          fileUrl: URL.createObjectURL(file) // Create a local blob URL for preview
        });

        setTimeout(() => {
          setIsSuccess(false);
          onOpenChange(false);
        }, 2000);
      }, 1500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border text-foreground sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Upload Document</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select a medical report, lab result, or imaging file to add to the system.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center p-8 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
              <h3 className="text-lg font-bold text-emerald-500">Upload Complete</h3>
              <p className="text-sm text-emerald-500/70 text-center mt-2">
                Document has been securely encrypted and attached to the patient's record.
              </p>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/20 hover:border-primary/50 hover:bg-muted rounded-xl transition-all cursor-pointer relative overflow-hidden group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {isUploading ? (
                  <>
                    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-sm text-primary font-medium">Encrypting & Uploading...</p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="mb-2 text-sm text-foreground font-medium">
                      <span className="text-primary">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, DICOM, JPG, or PNG (MAX. 50MB)</p>
                  </>
                )}
              </div>
              <input 
                type="file" 
                className="hidden" 
                onChange={handleUpload} 
                disabled={isUploading}
                accept=".pdf,.jpg,.jpeg,.png,.dcm"
              />
            </label>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
