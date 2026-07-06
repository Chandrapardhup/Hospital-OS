import React, { useState } from 'react';
import { Calendar, Activity, Pill, FileText, CalendarPlus, Clock, Video } from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { useAuthStore } from '../../store/useAuthStore';
import { BookAppointmentModal } from '../../components/appointments/BookAppointmentModal';
import type { AppointmentStatus } from '../../types/hospital';
import { useTranslation } from '../../translations';

export default function PatientDashboard() {
  const user = useAuthStore(state => state.user);
  const { t } = useTranslation();
  const patients = useHospitalStore(state => state.patients);
  const appointments = useHospitalStore(state => state.appointments);
  const doctors = useHospitalStore(state => state.doctors);

  // For demo, assume logged-in user matches patient email
  const currentPatient = patients.find(p => p.email === user?.email);
  const patientAppointments = appointments.filter(a => a.patientId === currentPatient?.id);

  const nextAppointment = patientAppointments
    .filter(a => a.status === 'Scheduled')
    .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime())[0];

  const getDoctor = (id: string) => doctors.find(d => d.id === id);

  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  if (!currentPatient) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">User Profile Not Found</h2>
          <p className="text-muted-foreground">Your profile could not be located in the system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <span>{currentPatient.name}</span>
          <span className="text-foreground/20">•</span>
          <span className="text-primary">User Portal</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">My Health Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('welcome_back')}, {currentPatient.name.split(' ')[0]}.</p>
          </div>
          <button 
            onClick={() => setIsBookModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-foreground font-medium rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all"
          >
            <CalendarPlus className="w-5 h-5" /> {t('book_appointment')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Next Appointment Card */}
        <div className="col-span-2 space-y-6">
          <div className="bg-card/30 border border-border rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">Next Appointment</h3>
                <p className="text-sm text-muted-foreground">Your upcoming scheduled visit</p>
              </div>
              <div className="p-3 rounded-full bg-primary/20 text-primary">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            {nextAppointment ? (
              <div className="bg-background/50 rounded-xl p-5 border border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/50 pb-4 mb-4 gap-4">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{nextAppointment.date}</p>
                    <p className="text-muted-foreground flex items-center gap-2 mt-1">
                      <Clock className="w-4 h-4" /> {nextAppointment.time}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={nextAppointment.status} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{getDoctor(nextAppointment.doctorId)?.name}</p>
                    <p className="text-sm text-muted-foreground">{getDoctor(nextAppointment.doctorId)?.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-foreground">{nextAppointment.type}</p>
                    <p className="text-xs text-muted-foreground">Type</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-background/50 rounded-xl p-8 border border-border/50 text-center">
                <p className="text-muted-foreground">You have no upcoming appointments.</p>
                <button 
                  onClick={() => setIsBookModalOpen(true)}
                  className="mt-4 text-primary hover:text-primary/80 font-medium text-sm transition-colors"
                >
                  Schedule one now &rarr;
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Vitals / Status */}
        <div className="bg-card/30 border border-border rounded-2xl p-6 backdrop-blur-md">
           <h3 className="text-lg font-bold text-foreground mb-6">Health Overview</h3>
           
           <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-500">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Blood Group</p>
                    <p className="text-xs text-muted-foreground">Type</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-foreground">{currentPatient.bloodGroup}</p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-500">
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Allergies</p>
                    <p className="text-xs text-muted-foreground">Reported</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground text-right">
                  {currentPatient.allergies?.length ? currentPatient.allergies.join(', ') : 'None'}
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Insurance</p>
                    <p className="text-xs text-muted-foreground">{currentPatient.insuranceProvider || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {/* Quick Link to Billing */}
              <button 
                onClick={() => window.location.href = '/billing'}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors mt-2"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20 text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-foreground">My Bills & Invoices</p>
                    <p className="text-xs text-muted-foreground">View or download your billing history</p>
                  </div>
                </div>
                <div className="text-primary font-bold">&rarr;</div>
              </button>
           </div>
        </div>
      </div>

      {/* Appointment History Table */}
      <div className="bg-card/30 border border-border rounded-2xl backdrop-blur-md overflow-hidden mt-6">
        <div className="p-6 border-b border-border/50">
          <h3 className="text-lg font-bold text-foreground">Appointment History</h3>
        </div>
        {/* Mobile View */}
        <div className="md:hidden flex flex-col gap-4 p-4">
          {patientAppointments.length > 0 ? (
            patientAppointments.map((appointment) => {
              const doctor = getDoctor(appointment.doctorId);
              return (
                <div key={appointment.id} className="bg-card/50 border border-border p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-foreground text-base">Dr. {doctor?.name || '-'}</h4>
                      <p className="text-xs text-muted-foreground font-mono">{appointment.date} @ {appointment.time}</p>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 rounded-md bg-muted font-medium text-foreground">
                      {doctor?.department || '-'}
                    </span>
                    <span className={`px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
                      appointment.type === 'Emergency' ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'
                    }`}>
                      {appointment.type}
                    </span>
                  </div>
                  {(appointment.remarks || appointment.prescription) && (
                    <div className="pt-2 border-t border-border space-y-1 text-sm">
                      {appointment.remarks && (
                        <p className="text-foreground/80"><span className="font-semibold text-muted-foreground">Notes:</span> {appointment.remarks}</p>
                      )}
                      {appointment.prescription && (
                        <p className="text-primary"><span className="font-semibold text-muted-foreground">Rx:</span> {appointment.prescription}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-muted-foreground bg-card/30 rounded-xl border border-border/50 border-dashed">
              No past appointments found.
            </div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-background/50">
              <tr>
                <th className="px-6 py-4 font-bold">DATE & TIME</th>
                <th className="px-6 py-4 font-bold">DOCTOR</th>
                <th className="px-6 py-4 font-bold">DEPARTMENT</th>
                <th className="px-6 py-4 font-bold">TYPE</th>
                <th className="px-6 py-4 font-bold">DETAILS</th>
                <th className="px-6 py-4 font-bold">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {patientAppointments.length > 0 ? (
                patientAppointments.map((appointment) => {
                  const doctor = getDoctor(appointment.doctorId);
                  return (
                    <tr key={appointment.id} className="hover:bg-muted transition-colors group">
                      <td className="px-6 py-4 font-mono text-foreground text-xs">
                        {appointment.date}<br/>
                        <span className="text-muted-foreground">{appointment.time}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">Dr. {doctor?.name || '-'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{doctor?.department || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          appointment.type === 'Emergency' ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'
                        }`}>
                          {appointment.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {appointment.remarks && <p className="text-foreground/80 truncate max-w-[150px]"><span className="text-muted-foreground">Notes:</span> {appointment.remarks}</p>}
                        {appointment.prescription && <p className="text-primary truncate max-w-[150px]"><span className="text-muted-foreground">Rx:</span> {appointment.prescription}</p>}
                        {!appointment.remarks && !appointment.prescription && <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={appointment.status} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No past appointments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BookAppointmentModal 
        open={isBookModalOpen} 
        onOpenChange={setIsBookModalOpen}
        defaultPatientId={currentPatient?.id}
        isPatientMode={true}
      />
    </div>
  );
}

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
