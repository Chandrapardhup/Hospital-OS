import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, UserPlus, ShieldAlert, Loader2 } from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmergencyCheckInModal({ open, onOpenChange }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [severity, setSeverity] = useState('Critical (Level 1)');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const addPatient = useHospitalStore(state => state.addPatient);
  const addAppointment = useHospitalStore(state => state.addAppointment);
  const addNotification = useHospitalStore(state => state.addNotification);
  const doctors = useHospitalStore(state => state.doctors);

  const emergencyDoctors = doctors.filter(d => d.department === 'Emergency' || d.department === 'Cardiology');
  const emergencyDoc = emergencyDoctors.length > 0 ? emergencyDoctors[0] : doctors[0];

  const handleEmergencyCheckIn = async () => {
    if (!name || !emergencyDoc) return;
    setIsLoading(true);

    const patId = `pat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newPatient = {
      id: patId,
      name,
      phone: phone || 'Unknown',
      dob: 'Unknown',
      gender: 'Other' as const,
      email: `${patId}@emergency.local`,
      bloodGroup: 'Unknown',
      address: 'Unknown',
      status: 'Emergency' as const,
      createdAt: new Date().toISOString()
    };

    await addPatient(newPatient);

    const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const token = `E-${Math.floor(Math.random() * 99) + 1}`; // E for Emergency

    await addAppointment({
      id: appointmentId,
      patientId: patId,
      doctorId: emergencyDoc.id,
      date: today,
      time: now,
      type: 'Emergency',
      status: 'Waiting', // High priority token
      symptoms: `${severity} - ${notes}`,
      tokenNumber: token
    });

    // Notify doctor
    await addNotification({
      userId: emergencyDoc.id,
      title: 'CRITICAL EMERGENCY ARRIVED',
      message: `Patient: ${name}. Severity: ${severity}. Immediate action required.`,
      type: 'error'
    });

    // Notify global admin
    await addNotification({
      userId: 'global',
      title: 'Emergency Patient Checked In',
      message: `${name} has been checked into the Emergency queue. Assigned to Dr. ${emergencyDoc.name}.`,
      type: 'warning'
    });

    setIsLoading(false);
    onOpenChange(false);
    setName('');
    setPhone('');
    setSeverity('Critical (Level 1)');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
        <DialogHeader className="p-6 border-b border-red-500/20 bg-red-500/10">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-500">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            Emergency Check-In
          </DialogTitle>
          <p className="text-sm text-red-500/80 mt-1 font-medium">Bypass normal queue. Highest priority token.</p>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Patient Name (or "Unknown")</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. John Doe / Unknown Male"
              className="w-full bg-background border border-border rounded-xl p-3 text-sm text-foreground focus:border-red-500 focus:outline-none" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Phone (Optional)</label>
            <input 
              type="text" 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="Attendant's contact if available"
              className="w-full bg-background border border-border rounded-xl p-3 text-sm text-foreground focus:border-red-500 focus:outline-none" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Severity Level</label>
            <select 
              value={severity} 
              onChange={e => setSeverity(e.target.value)} 
              className="w-full bg-background border border-red-500/30 text-red-500 font-semibold rounded-xl p-3 text-sm focus:border-red-500 focus:outline-none"
            >
              <option>Critical (Level 1) - Immediate Life-saving</option>
              <option>Urgent (Level 2) - Within 15 mins</option>
              <option>Less Urgent (Level 3) - Within 60 mins</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Brief Notes / Condition</label>
            <textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="e.g. Chest pain, unconscious, bleeding..."
              className="w-full bg-background border border-border rounded-xl p-3 text-sm text-foreground focus:border-red-500 focus:outline-none min-h-[80px]" 
            />
          </div>

          <div className="bg-red-500/10 p-3 rounded-xl border border-red-500/20 flex items-start gap-3 mt-4">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-red-500 uppercase">Emergency Doctor Assigned</div>
              <div className="text-sm font-medium text-foreground">Dr. {emergencyDoc?.name || 'On-Call ER Doctor'}</div>
            </div>
          </div>

          <button 
            onClick={handleEmergencyCheckIn}
            disabled={!name || isLoading}
            className="w-full mt-4 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] flex justify-center items-center gap-2 disabled:opacity-50 disabled:shadow-none"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Dispatch Emergency Code'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
