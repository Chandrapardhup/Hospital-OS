import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Calendar, Activity, Pill, FileText, CalendarPlus, Clock, Video, QrCode, X } from 'lucide-react';
import { useHospitalStore } from '../../store/useHospitalStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { QRCodeSVG } from 'qrcode.react';
import { BookAppointmentModal } from '../../components/appointments/BookAppointmentModal';
import type { AppointmentStatus } from '../../types/hospital';
import { useTranslation } from '../../translations';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function PatientDashboard() {
  const user = useAuthStore(state => state.user);
  const setTheme = useSettingsStore(state => state.setTheme);

  React.useEffect(() => {
    const hasInit = localStorage.getItem('patient_theme_init');
    if (!hasInit) {
      setTheme('light');
      localStorage.setItem('patient_theme_init', 'true');
    }
  }, [setTheme]);

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
  const [showQrApptId, setShowQrApptId] = useState<string | null>(null);
  
  const { searchQuery } = useOutletContext<{ searchQuery?: string }>() || {};

  const filteredAppointments = patientAppointments.filter(a => {
    if (!searchQuery) return true;
    const doctor = getDoctor(a.doctorId);
    const searchLower = searchQuery.toLowerCase();
    return (
      a.type.toLowerCase().includes(searchLower) ||
      (doctor?.name || '').toLowerCase().includes(searchLower) ||
      (doctor?.department || '').toLowerCase().includes(searchLower) ||
      a.date.includes(searchLower)
    );
  });

  if (!currentPatient) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <h2 className="text-2xl font-bold text-foreground">User Profile Not Found</h2>
          <p className="text-muted-foreground">Your profile could not be located in the system.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto space-y-8 pb-20"
    >
      <motion.div variants={itemVariants} className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          <span>{currentPatient.name}</span>
          <span className="text-border">•</span>
          <span className="text-foreground">User Portal</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-3xl font-semibold text-foreground tracking-tight">My Health Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('welcome_back')}, {currentPatient.name.split(' ')[0]}.</p>
          </div>
          <button 
            onClick={() => setIsBookModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-foreground text-background hover:bg-foreground/90 font-medium rounded-xl shadow-sm transition-all"
          >
            <CalendarPlus className="w-5 h-5" /> {t('book_appointment')}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Next Appointment Card */}
        <motion.div variants={itemVariants} className="col-span-1 md:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Next Appointment</h3>
                <p className="text-sm text-muted-foreground">Your upcoming scheduled visit</p>
              </div>
              <div className="p-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                <Calendar className="w-5 h-5" />
              </div>
            </div>

            {nextAppointment ? (
              <div className="bg-muted/50 rounded-xl p-6 border border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/50 pb-5 mb-5 gap-4">
                  <div>
                    <p className="text-3xl font-semibold text-foreground tracking-tight">{nextAppointment.date}</p>
                    <p className="text-muted-foreground flex items-center gap-2 mt-2 font-medium">
                      <Clock className="w-4 h-4" /> {nextAppointment.time}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={nextAppointment.status} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{getDoctor(nextAppointment.doctorId)?.name}</p>
                    <p className="text-sm text-muted-foreground">{getDoctor(nextAppointment.doctorId)?.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{nextAppointment.type}</p>
                    <p className="text-xs text-muted-foreground">Type</p>
                  </div>
                </div>
                
                <div className="mt-6 pt-5 border-t border-border/50 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground uppercase tracking-widest">Appointment QR Pass</h4>
                    <p className="text-xs text-muted-foreground">Scan at the self-service kiosk to check in instantly.</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowQrApptId(nextAppointment.id); }}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-foreground font-medium rounded-xl transition-colors shadow-sm border border-border/50"
                  >
                    <QrCode className="w-4 h-4" /> View Pass
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-muted/30 rounded-xl p-8 border border-border/50 text-center">
                <p className="text-muted-foreground">You have no upcoming appointments.</p>
                <button 
                  onClick={() => setIsBookModalOpen(true)}
                  className="mt-4 text-foreground hover:opacity-80 font-medium text-sm transition-opacity"
                >
                  Schedule one now &rarr;
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Vitals / Status */}
        <motion.div variants={itemVariants} className="bg-card border border-border shadow-sm rounded-2xl p-6">
           <h3 className="text-lg font-semibold text-foreground mb-6">Health Overview</h3>
           
           <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50 transition-colors hover:bg-muted/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-foreground">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Blood Group</p>
                    <p className="text-xs text-muted-foreground">Type</p>
                  </div>
                </div>
                <p className="text-lg font-semibold text-foreground">{currentPatient.bloodGroup}</p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50 transition-colors hover:bg-muted/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-foreground">
                    <Pill className="w-4 h-4" />
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

              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50 transition-colors hover:bg-muted/80">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-foreground">
                    <FileText className="w-4 h-4" />
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
                className="w-full flex items-center justify-between p-4 rounded-xl bg-foreground text-background hover:opacity-90 transition-opacity mt-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background/20 text-background">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-background">My Bills & Invoices</p>
                    <p className="text-xs text-background/80">View or download history</p>
                  </div>
                </div>
                <div className="font-bold text-background">&rarr;</div>
              </button>
           </div>
        </motion.div>
      </div>

      {/* Appointment History Table */}
      <motion.div variants={itemVariants} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden mt-6">
        <div className="p-6 border-b border-border/50">
          <h3 className="text-lg font-semibold text-foreground">Appointment History</h3>
        </div>
        {/* Mobile View */}
        <div className="md:hidden flex flex-col gap-4 p-4 bg-muted/20">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => {
              const doctor = getDoctor(appointment.doctorId);
              return (
                <div key={appointment.id} className="bg-card border border-border shadow-sm p-5 rounded-xl flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-foreground text-base">Dr. {doctor?.name || '-'}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{appointment.date} @ {appointment.time}</p>
                    </div>
                    <StatusBadge status={appointment.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-md bg-muted font-medium text-foreground">
                      {doctor?.department || '-'}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-muted font-medium text-foreground">
                      {appointment.type}
                    </span>
                  </div>
                  {(appointment.remarks || appointment.prescription) && (
                    <div className="pt-3 border-t border-border/50 space-y-2 text-sm">
                      {appointment.remarks && (
                        <p className="text-foreground/80"><span className="font-medium text-muted-foreground mr-2">Notes:</span> {appointment.remarks}</p>
                      )}
                      {appointment.prescription && (
                        <p className="text-foreground"><span className="font-medium text-muted-foreground mr-2">Rx:</span> {appointment.prescription}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-muted-foreground bg-muted/50 rounded-xl border border-border/50">
              No past appointments found.
            </div>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto bg-card">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 border-b border-border/50">
              <tr>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Doctor</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => {
                  const doctor = getDoctor(appointment.doctorId);
                  return (
                    <tr key={appointment.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 text-foreground font-medium">
                        {appointment.date}<br/>
                        <span className="text-muted-foreground font-normal">{appointment.time}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">Dr. {doctor?.name || '-'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{doctor?.department || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-muted text-foreground">
                          {appointment.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {appointment.remarks && <p className="text-foreground/80 truncate max-w-[150px]"><span className="text-muted-foreground mr-1">Notes:</span>{appointment.remarks}</p>}
                        {appointment.prescription && <p className="text-foreground truncate max-w-[150px]"><span className="text-muted-foreground mr-1">Rx:</span>{appointment.prescription}</p>}
                        {!appointment.remarks && !appointment.prescription && <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={appointment.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {appointment.status === 'Scheduled' && (
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowQrApptId(appointment.id); }}
                            className="p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-foreground rounded-lg transition-colors border border-border/50"
                            title="View QR Pass"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground bg-muted/10">
                    No past appointments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <BookAppointmentModal 
        open={isBookModalOpen} 
        onOpenChange={setIsBookModalOpen}
        defaultPatientId={currentPatient?.id}
        isPatientMode={true}
      />

      {showQrApptId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
            onClick={() => setShowQrApptId(null)} 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-sm bg-card border border-border shadow-2xl rounded-2xl p-6 z-[10000]"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <QrCode className="w-5 h-5 text-foreground" /> Appointment QR Pass
              </h2>
              <button 
                onClick={() => setShowQrApptId(null)} 
                className="text-muted-foreground hover:text-foreground rounded-full p-1.5 hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">
              Scan this code at the reception for instant check-in.
            </p>

            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-border/50 inline-block">
                <QRCodeSVG 
                  value={`appointment:${showQrApptId}`} 
                  size={200}
                  level="H"
                />
              </div>
              
              <div className="w-full bg-muted/50 rounded-xl p-4 space-y-2 text-sm text-center border border-border/50">
                <p className="text-muted-foreground font-medium">Appointment ID</p>
                <p className="font-mono font-semibold text-foreground text-lg tracking-widest">{showQrApptId}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  let styles = "bg-muted text-muted-foreground border-border";
  
  if (status === "In Progress") styles = "bg-zinc-800 text-zinc-100 border-zinc-700 dark:bg-zinc-100 dark:text-zinc-900";
  else if (status === "Waiting") styles = "bg-zinc-100 text-zinc-900 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100";
  else if (status === "Scheduled") styles = "bg-foreground text-background border-transparent";
  else if (status === "Completed") styles = "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400";
  else if (status === "No Show" || status === "Cancelled") styles = "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400";

  return (
    <span className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md border ${styles}`}>
      {status}
    </span>
  );
}
