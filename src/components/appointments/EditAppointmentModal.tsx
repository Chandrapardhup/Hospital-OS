import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppointmentService } from '../../services/AppointmentService';
import { useAuthStore } from '../../store/useAuthStore';
import type { Appointment, AppointmentStatus } from '../../types/hospital';

interface EditAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
}

export function EditAppointmentModal({ open, onOpenChange, appointment }: EditAppointmentModalProps) {
  const [status, setStatus] = useState<AppointmentStatus>('Scheduled');
  const [remarks, setRemarks] = useState('');
  const [prescription, setPrescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    if (appointment) {
      setStatus(appointment.status);
      setRemarks(appointment.remarks || appointment.notes || '');
      setPrescription(appointment.prescription || '');
    }
  }, [appointment]);

  const handleSave = async () => {
    if (!appointment) return;
    setIsSaving(true);
    await AppointmentService.updateAppointment(appointment.id, {
      status,
      remarks,
      prescription
    });
    setIsSaving(false);
    onOpenChange(false);
  };

  if (!appointment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border text-foreground sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Appointment</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update status, add consultation remarks, and prescribe medications.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {appointment.type === 'Emergency' && user?.role === 'doctor' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-red-500">Live Emergency Instructions (Visible to Reception)</label>
              <textarea
                value={remarks}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarks(e.target.value)}
                placeholder="e.g. Prepare OT, require blood type O-..."
                className="bg-red-500/5 border-red-500/20 text-foreground min-h-[120px] w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:border-red-500/50 transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-2">Note: Admission and status updates for Emergency patients are handled by the Receptionist.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Status</label>
                <Select value={status} onValueChange={(val) => setStatus(val as AppointmentStatus)}>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border text-foreground">
                    {appointment.type === 'Admitting' ? (
                      <>
                        <SelectItem value="Scheduled">Admitted (Pending)</SelectItem>
                        <SelectItem value="In Progress">Treating / In Progress</SelectItem>
                        <SelectItem value="Completed">Discharged / Completed</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                        <SelectItem value="No Show">No Show</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Clinical Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarks(e.target.value)}
                  placeholder="e.g. Patient presents with mild fever and fatigue..."
                  className="bg-muted border-border text-foreground min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/80">Prescription</label>
                <textarea
                  value={prescription}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrescription(e.target.value)}
                  placeholder="e.g. 1. Amoxicillin 500mg (1x3) for 7 days"
                  className="bg-muted border-border text-foreground min-h-[100px] w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
            </>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-border/50">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-background text-foreground border-border hover:bg-muted">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className={`${appointment.type === 'Emergency' && user?.role === 'doctor' ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'} text-white`}>
              {isSaving ? 'Saving...' : (appointment.type === 'Emergency' && user?.role === 'doctor' ? 'Send Instructions' : 'Save Changes')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
