import React, { useState } from 'react';
import { Users, Clock, CalendarCheck, Activity, Search, Calendar, Edit } from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { AppointmentStatus } from '../../types/hospital';
import { useTranslation } from '../../translations';
import { ManageScheduleModal } from '../../components/doctors/ManageScheduleModal';
import { EditAppointmentModal } from '../../components/appointments/EditAppointmentModal';
import type { Appointment } from '../../types/hospital';

export default function DoctorDashboard() {
  const user = useAuthStore(state => state.user);
  const { t } = useTranslation();
  const patients = useHospitalStore(state => state.patients);
  const appointments = useHospitalStore(state => state.appointments);
  const doctors = useHospitalStore(state => state.doctors);

  // Link user to doctor profile
  const currentDoctor = doctors.find(d => d.email === user?.email);
  const myAppointments = appointments.filter(a => a.doctorId === currentDoctor?.id);

  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || id;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = myAppointments.filter(a => a.date === todayStr); 
  const pendingCount = todayAppointments.filter(a => a.status === 'Scheduled').length;
  const completedCount = todayAppointments.filter(a => a.status === 'Completed').length;
  const totalPatients = patients.filter(p => p.assignedDoctorId === currentDoctor?.id).length;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [dismissedEmergencies, setDismissedEmergencies] = useState<string[]>([]);
  
  const filteredAppointments = myAppointments.filter(a => 
    getPatientName(a.patientId).toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeEmergencies = myAppointments.filter(a => a.type === 'Emergency' && a.status === 'Scheduled' && !dismissedEmergencies.includes(a.id));
  const emergency = activeEmergencies[0]; // Get the first active emergency

  if (!currentDoctor) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Doctor Profile Not Found</h2>
          <p className="text-muted-foreground">Your staff profile could not be located in the system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <span>{currentDoctor.department}</span>
          <span className="text-foreground/20">•</span>
          <span className="text-primary">Doctor Portal</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Physician Workspace</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('welcome_back')}, {currentDoctor.name}.</p>
          </div>
          <button 
            onClick={() => setIsScheduleModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 font-medium rounded-xl transition-all"
          >
            <Calendar className="w-4 h-4" /> Manage Schedule
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8">
        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Today's Patients</p>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-bold text-foreground mb-2">{todayAppointments.length}</div>
          <p className="text-xs font-medium text-muted-foreground">Total appointments today</p>
        </div>
        
        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pending</p>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-foreground mb-2">{pendingCount}</div>
          <p className="text-xs font-medium text-amber-500">Waiting to be seen</p>
        </div>

        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Completed</p>
            <CalendarCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-foreground mb-2">{completedCount}</div>
          <p className="text-xs font-medium text-emerald-500">Consultations finished</p>
        </div>

        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">My Patients</p>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-foreground mb-2">{totalPatients}</div>
          <p className="text-xs font-medium text-muted-foreground">Assigned to your care</p>
        </div>
      </div>

      <div className="bg-card/30 border border-border rounded-2xl backdrop-blur-md overflow-hidden mt-6">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search patients or appointment type..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background/50 border border-border rounded-full py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <AIPrescriptionModal />
        </div>
        {/* Mobile View */}
        <div className="md:hidden flex flex-col gap-4 p-4">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="bg-card/50 border border-border p-4 rounded-xl flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-foreground text-base">{getPatientName(appointment.patientId)}</h4>
                    <p className="text-xs text-muted-foreground font-mono">{appointment.date} @ {appointment.time}</p>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
                    appointment.type === 'Emergency' ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'
                  }`}>
                    {appointment.type}
                  </span>
                </div>
                {appointment.symptoms && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    <span className="font-semibold text-foreground/80">Symptoms:</span> {appointment.symptoms}
                  </p>
                )}
                <div className="pt-2 border-t border-border flex justify-end gap-2">
                  <button 
                    onClick={() => setEditingAppointment(appointment)}
                    className="flex-1 text-amber-500 hover:bg-amber-500/20 font-medium text-xs transition-colors px-3 py-2 rounded-lg bg-amber-500/10 flex items-center justify-center gap-2"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit & Prescribe
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-muted-foreground bg-card/30 rounded-xl border border-border/50 border-dashed">
              No appointments found matching your search.
            </div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-background/50">
              <tr>
                <th className="px-6 py-4 font-bold">TIME & DATE</th>
                <th className="px-6 py-4 font-bold">PATIENT</th>
                <th className="px-6 py-4 font-bold">TYPE</th>
                <th className="px-6 py-4 font-bold">SYMPTOMS</th>
                <th className="px-6 py-4 font-bold">STATUS</th>
                <th className="px-6 py-4 font-bold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-muted transition-colors group">
                    <td className="px-6 py-4 font-mono text-foreground text-xs">
                      {appointment.date}<br/>
                      <span className="text-muted-foreground">{appointment.time}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {getPatientName(appointment.patientId)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        appointment.type === 'Emergency' ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'
                      }`}>
                        {appointment.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground truncate max-w-[200px]">
                      {appointment.symptoms || appointment.notes || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={appointment.status} />
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button 
                        onClick={() => setEditingAppointment(appointment)}
                        className="text-amber-500 hover:text-amber-600 font-medium text-xs transition-colors px-3 py-1.5 rounded-lg bg-amber-500/10 flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" /> Edit & Prescribe
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No appointments found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ManageScheduleModal 
        open={isScheduleModalOpen}
        onOpenChange={setIsScheduleModalOpen}
        doctor={currentDoctor}
      />
      <EditAppointmentModal 
        open={editingAppointment !== null}
        onOpenChange={(open) => !open && setEditingAppointment(null)}
        appointment={editingAppointment}
      />
    </div>
  );
}

import * as Dialog from '@radix-ui/react-dialog';
import { X, Send, Loader2, Sparkles } from 'lucide-react';
import { AIService } from '../../services/AIService';

function AIPrescriptionModal() {
  const [open, setOpen] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [proposedMeds, setProposedMeds] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!symptoms || !diagnosis || !proposedMeds) return;
    setIsLoading(true);
    // Mock allergies array for Pharmacy Agent check
    const mockAllergies = ["Penicillin", "Peanuts"];
    const res = await AIService.checkPrescriptionSafety(symptoms, diagnosis, proposedMeds, mockAllergies);
    setResponse(res);
    setIsLoading(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all">
          <Sparkles className="w-4 h-4" /> Smart Prescription
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl p-6 z-50">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Pharmacy Agent Verification
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>
          
          <div className="space-y-4">
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-sm text-red-500 font-medium">
              ⚠️ Patient Known Allergies: Penicillin, Peanuts
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Symptoms</label>
                <input 
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  placeholder="e.g. Cough, Fever"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Diagnosis</label>
                <input 
                  value={diagnosis}
                  onChange={e => setDiagnosis(e.target.value)}
                  placeholder="e.g. Viral URI"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1 block">Proposed Medications</label>
              <input 
                value={proposedMeds}
                onChange={e => setProposedMeds(e.target.value)}
                placeholder="e.g. Amoxicillin 500mg, Paracetamol"
                className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            
            <button 
              onClick={handleGenerate}
              disabled={isLoading || !symptoms || !diagnosis || !proposedMeds}
              className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-all disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Verify & Draft Prescription
            </button>
            
            {response && (
              <div className="mt-4 p-4 bg-background/50 border border-border rounded-xl max-h-48 overflow-y-auto">
                <p className="text-sm font-medium text-muted-foreground mb-2">Pharmacy Agent Assessment:</p>
                <div className="text-sm text-foreground whitespace-pre-wrap">{response}</div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  let styles = "bg-muted/80 text-muted-foreground border-border";
  
  if (status === "In Progress") styles = "bg-primary/10 text-primary border-primary/20";
  else if (status === "Scheduled") styles = "bg-amber-500/10 text-amber-500 border-amber-500/20";

  else if (status === "Completed") styles = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  else if (status === "No Show" || status === "Cancelled") styles = "bg-red-500/10 text-red-500 border-red-500/20";

  return (
    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${styles}`}>
      {status}
    </span>
  );
}

function PatientTimelineModal({ patientId, open, onOpenChange }: { patientId: string | null, open: boolean, onOpenChange: (o: boolean) => void }) {
  const patients = useHospitalStore(state => state.patients);
  const patient = patients.find(p => p.id === patientId);
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (open && patient) {
      const fetchSummary = async () => {
        setIsLoading(true);
        // Mocking a chronological timeline history for the demonstration
        const history = [
          { year: '2022', event: 'Diabetes Diagnosed', details: 'HbA1c 7.5%' },
          { year: '2023', event: 'Medication Started', details: 'Metformin 500mg' },
          { year: '2024', event: 'Blood Test', details: 'HbA1c 6.8%' },
          { year: '2025', event: 'Hospital Admission', details: 'Minor Hypoglycemia' }
        ];
        const res = await AIService.generatePatientSummary(patient, history);
        setSummary(res);
        setIsLoading(false);
      };
      fetchSummary();
    }
  }, [open, patient]);

  if (!patient) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-card border border-border shadow-2xl rounded-2xl p-6 z-50 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-2xl font-bold text-foreground">
              {patient.name}'s Medical Timeline
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <div className="col-span-2 space-y-6">
              <div className="relative border-l-2 border-primary/20 ml-4 space-y-8">
                {/* Timeline UI */}
                {[
                  { year: '2022', event: 'Diabetes Diagnosed' },
                  { year: '2023', event: 'Metformin Started' },
                  { year: '2024', event: 'Blood Test - Improved' },
                  { year: '2025', event: 'Minor Hypoglycemia Incident' },
                  { year: 'Current', event: 'Routine Consultation' }
                ].map((item, i) => (
                  <div key={i} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 bg-background border-2 border-primary rounded-full"></div>
                    <h3 className="text-sm font-bold text-primary mb-1">{item.year}</h3>
                    <p className="text-foreground font-medium">{item.event}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-1 space-y-4">
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl">
                <h3 className="text-sm font-bold text-primary mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> AI Assistant Summary
                </h3>
                {isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Analyzing history...
                  </div>
                ) : (
                  <div className="text-sm text-foreground space-y-2 whitespace-pre-wrap">
                    {summary}
                  </div>
                )}
              </div>
              
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                <h3 className="text-sm font-bold text-red-500 mb-2">Known Allergies</h3>
                <ul className="list-disc list-inside text-sm text-foreground">
                  <li>Penicillin</li>
                  <li>Peanuts</li>
                </ul>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
