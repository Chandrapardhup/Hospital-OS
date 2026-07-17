import React, { useState } from 'react';
import { Users, Clock, CalendarCheck, Activity, Search, Calendar, Edit, Eye, FileText } from 'lucide-react';
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
  const [viewingPatientId, setViewingPatientId] = useState<string | null>(null);
  
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

      {/* LIVE WAITING ROOM PANEL */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Live Waiting Room</h2>
              <p className="text-sm text-muted-foreground">Patients currently checked in and waiting</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-blue-500/10 text-blue-500 rounded-full text-sm font-bold border border-blue-500/20">
            {myAppointments.filter(a => a.status === 'Waiting' && a.date === todayStr).length} Waiting
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myAppointments.filter(a => a.status === 'Waiting' && a.date === todayStr).length > 0 ? (
            myAppointments
              .filter(a => a.status === 'Waiting' && a.date === todayStr)
              .map(appointment => (
              <div key={appointment.id} className="bg-card/50 border border-border p-4 rounded-xl flex flex-col gap-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-foreground text-lg">{getPatientName(appointment.patientId)}</h4>
                    <p className="text-xs text-muted-foreground font-mono">{appointment.time}</p>
                  </div>
                  {appointment.tokenNumber && (
                    <div className="px-3 py-1 bg-blue-500 text-white rounded-lg font-mono font-bold shadow-lg shadow-blue-500/30">
                      {appointment.tokenNumber}
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => {
                    useHospitalStore.getState().updateAppointment(appointment.id, { status: 'In Progress' });
                  }}
                  className="w-full mt-2 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                >
                  Call Next (In Progress)
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-muted-foreground bg-background/50 rounded-xl border border-border/50 border-dashed">
              Waiting room is empty. No checked-in patients.
            </div>
          )}
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
                    onClick={() => setViewingPatientId(appointment.patientId)}
                    className="flex-1 text-primary hover:bg-primary/20 font-medium text-xs transition-colors px-3 py-2 rounded-lg bg-primary/10 flex items-center justify-center gap-2"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Patient
                  </button>
                  {!(appointment.status === 'Completed' || appointment.status === 'Cancelled' || appointment.status === 'No Show') && (
                    <button 
                      onClick={() => setEditingAppointment(appointment)}
                      className="flex-1 text-amber-500 hover:bg-amber-500/20 font-medium text-xs transition-colors px-3 py-2 rounded-lg bg-amber-500/10 flex items-center justify-center gap-2"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit & Prescribe
                    </button>
                  )}
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
                        onClick={() => setViewingPatientId(appointment.patientId)}
                        className="text-primary hover:text-primary/80 font-medium text-xs transition-colors px-3 py-1.5 rounded-lg bg-primary/10 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> View Patient
                      </button>
                      {!(appointment.status === 'Completed' || appointment.status === 'Cancelled' || appointment.status === 'No Show') && (
                        <button 
                          onClick={() => setEditingAppointment(appointment)}
                          className="text-amber-500 hover:text-amber-600 font-medium text-xs transition-colors px-3 py-1.5 rounded-lg bg-amber-500/10 flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" /> Edit & Prescribe
                        </button>
                      )}
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
      <ViewPatientModal 
        patientId={viewingPatientId}
        open={viewingPatientId !== null}
        onOpenChange={(open) => !open && setViewingPatientId(null)}
      />
    </div>
  );
}

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

function StatusBadge({ status }: { status: AppointmentStatus }) {
  let styles = "bg-muted/80 text-muted-foreground border-border";
  
  if (status === "In Progress") styles = "bg-primary/10 text-primary border-primary/20";
  else if (status === "Waiting") styles = "bg-blue-500/10 text-blue-500 border-blue-500/20";
  else if (status === "Scheduled") styles = "bg-amber-500/10 text-amber-500 border-amber-500/20";

  else if (status === "Completed") styles = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  else if (status === "No Show" || status === "Cancelled") styles = "bg-red-500/10 text-red-500 border-red-500/20";

  return (
    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${styles}`}>
      {status}
    </span>
  );
}

function ViewPatientModal({ patientId, open, onOpenChange }: { patientId: string | null, open: boolean, onOpenChange: (o: boolean) => void }) {
  const patients = useHospitalStore(state => state.patients);
  const medicalRecords = useHospitalStore(state => state.medicalRecords);
  const appointments = useHospitalStore(state => state.appointments);
  const patient = patients.find(p => p.id === patientId);
  const patientRecords = medicalRecords.filter(r => r.patientId === patientId);
  const patientAppointments = appointments.filter(a => a.patientId === patientId);

  if (!patient) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-3xl bg-card border border-border shadow-2xl rounded-2xl p-6 z-50 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-2xl font-bold text-foreground">
              {patient.name}
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          {/* Patient Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Patient ID', value: patient.id },
              { label: 'Gender', value: patient.gender },
              { label: 'DOB', value: patient.dob },
              { label: 'Blood Group', value: patient.bloodGroup },
              { label: 'Phone', value: patient.phone },
              { label: 'Status', value: patient.status },
              { label: 'Email', value: patient.email },
              { label: 'Insurance', value: patient.insuranceProvider || 'N/A' },
              { label: 'Address', value: patient.address || 'N/A' },
            ].map((item, i) => (
              <div key={i} className="bg-background/50 border border-border rounded-xl p-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</p>
                <p className="text-sm font-medium text-foreground mt-1 truncate">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Allergies */}
          {patient.allergies && patient.allergies.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
              <h3 className="text-sm font-bold text-red-500 mb-2">⚠ Known Allergies</h3>
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map((a, i) => (
                  <span key={i} className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Appointments */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Appointment History
            </h3>
            {patientAppointments.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {patientAppointments.slice(0, 10).map(a => (
                  <div key={a.id} className="flex items-center justify-between bg-background/50 border border-border rounded-lg px-4 py-2">
                    <div>
                      <span className="text-sm font-medium text-foreground">{a.date} @ {a.time}</span>
                      <span className="ml-3 text-xs text-muted-foreground">{a.type}</span>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No appointment history.</p>
            )}
          </div>

          {/* Medical Records */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Medical Records
            </h3>
            {patientRecords.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {patientRecords.map((mr, i) => (
                  <div key={i} className="bg-background/50 border border-border p-4 rounded-xl flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-semibold text-sm text-foreground truncate">{mr.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{mr.sub}</p>
                      <a href={mr.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary hover:underline mt-2 inline-block">View Document</a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-background/30 rounded-xl border border-border/50 border-dashed">
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No medical records uploaded for this patient yet.</p>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
