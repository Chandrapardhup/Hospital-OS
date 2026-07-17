import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, CalendarCheck, Clock, Loader2, CheckCircle } from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppointmentCheckInModal({ open, onOpenChange }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const appointments = useHospitalStore(state => state.appointments);
  const patients = useHospitalStore(state => state.patients);
  const doctors = useHospitalStore(state => state.doctors);
  const updateAppointment = useHospitalStore(state => state.updateAppointment);
  const addNotification = useHospitalStore(state => state.addNotification);

  const today = new Date().toISOString().split('T')[0];

  const searchResults = appointments.filter(a => {
    if (a.date !== today || a.status !== 'Scheduled') return false;
    
    const p = patients.find(pat => pat.id === a.patientId);
    if (!p) return false;

    if (!searchQuery) return true; // Show all scheduled today if no query

    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.phone.includes(searchQuery) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || 'Unknown';
  const getDoctorName = (id: string) => doctors.find(d => d.id === id)?.name || 'Unknown';

  const handleCheckIn = async (appointment: any) => {
    setIsLoading(true);
    
    const token = appointment.tokenNumber || `A-${Math.floor(Math.random() * 99) + 1}`;
    
    await updateAppointment(appointment.id, {
      status: 'Waiting',
      tokenNumber: token
    });
    
    // Notify doctor
    await addNotification({
      userId: appointment.doctorId,
      title: 'Patient Checked In',
      message: `${getPatientName(appointment.patientId)} has checked in for their appointment. Token: ${token}`,
      type: 'info'
    });

    setIsLoading(false);
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-background border-border">
        <DialogHeader className="p-6 border-b border-border/50 bg-emerald-500/10">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-emerald-500">
            <CalendarCheck className="w-5 h-5" />
            Appointment Check-In
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1 font-normal">Check in patients who booked online or previously scheduled.</p>
        </DialogHeader>

        <div className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Patient Name, Phone, or Appointment ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {searchResults.length > 0 ? searchResults.map(a => (
              <div key={a.id} className="p-4 border border-border rounded-xl bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-emerald-500/50">
                <div>
                  <div className="font-bold text-foreground text-sm">{getPatientName(a.patientId)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Dr. {getDoctorName(a.doctorId)} • {a.type}</div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {a.time}
                  </div>
                </div>
                <button 
                  onClick={() => handleCheckIn(a)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Check-In
                </button>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No pending appointments found for today.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
