import React, { useState } from "react";
import { CalendarPlus, Edit } from "lucide-react";
import { useHospitalStore } from "../store/useHospitalStore";
import type { AppointmentStatus } from "../types/hospital";
import { BookAppointmentModal } from "../components/appointments/BookAppointmentModal";
import { EditAppointmentModal } from "../components/appointments/EditAppointmentModal";

export default function Appointments() {
  const appointments = useHospitalStore(state => state.appointments);
  const patients = useHospitalStore(state => state.patients);
  const doctors = useHospitalStore(state => state.doctors);
  
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);

  // Helper functions to get names from IDs
  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || id;
  const getDoctor = (id: string) => doctors.find(d => d.id === id);

  const completedCount = appointments.filter(a => a.status === 'Completed').length;
  const todayCount = appointments.length; // Mocking all as today for demo purposes
  const upcomingCount = appointments.filter(a => a.status === 'Scheduled').length;
  const noShowCount = appointments.filter(a => a.status === 'No Show').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <span>Administrator</span>
          <span className="text-foreground/20">•</span>
          <span className="text-primary">Command Center</span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-1 gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Appointments</h1>
            <p className="text-sm text-muted-foreground mt-1">Today · {todayCount} scheduled · {completedCount} completed</p>
          </div>
          <button 
            onClick={() => setIsBookModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-foreground font-medium rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all w-full sm:w-auto justify-center min-h-[48px]"
          >
            <CalendarPlus className="w-5 h-5" /> Book appointment
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8">
        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Today</p>
          <div className="text-3xl font-bold text-foreground mb-2">{todayCount}</div>
        </div>
        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Completed</p>
          <div className="text-3xl font-bold text-foreground mb-2">{completedCount}</div>
          <div className="w-full bg-muted/80 h-1.5 rounded-full mt-2">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min((completedCount / (todayCount || 1)) * 100, 100)}%` }}></div>
          </div>
        </div>
        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Upcoming</p>
          <div className="text-3xl font-bold text-foreground mb-2">{upcomingCount}</div>
          <p className="text-xs font-medium text-muted-foreground">Waiting in queue</p>
        </div>
        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">No-Shows</p>
          <div className="text-3xl font-bold text-foreground mb-2">{noShowCount}</div>
          <p className="text-xs font-medium text-amber-500">Missed appointments</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-card/30 border border-border rounded-2xl backdrop-blur-md overflow-hidden mt-6">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-background/50">
              <tr>
                <th className="px-6 py-4 font-bold">TIME</th>
                <th className="px-6 py-4 font-bold">PATIENT</th>
                <th className="px-6 py-4 font-bold">DOCTOR</th>
                <th className="px-6 py-4 font-bold">DEPARTMENT</th>
                <th className="px-6 py-4 font-bold">TYPE</th>
                <th className="px-6 py-4 font-bold">DETAILS</th>
                <th className="px-6 py-4 font-bold">STATUS</th>
                <th className="px-6 py-4 font-bold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {appointments.map((appointment) => {
                const doctor = getDoctor(appointment.doctorId);
                return (
                  <tr key={appointment.id} className="hover:bg-muted transition-colors group">
                    <td className="px-6 py-4 font-mono text-foreground text-xs">{appointment.time}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{getPatientName(appointment.patientId)}</td>
                    <td className="px-6 py-4 text-muted-foreground">{doctor?.name || appointment.doctorId}</td>
                    <td className="px-6 py-4 text-muted-foreground">{doctor?.department || '-'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{appointment.type}</td>
                    <td className="px-6 py-4 text-xs">
                      {appointment.remarks && <p className="text-foreground/80 truncate max-w-[150px]"><span className="text-muted-foreground">Notes:</span> {appointment.remarks}</p>}
                      {appointment.prescription && <p className="text-primary truncate max-w-[150px]"><span className="text-muted-foreground">Rx:</span> {appointment.prescription}</p>}
                      {!appointment.remarks && !appointment.prescription && <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={appointment.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setEditingAppointment(appointment)}
                        className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Edit Appointment"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No appointments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden flex flex-col divide-y divide-border">
          {appointments.map((appointment) => {
            const doctor = getDoctor(appointment.doctorId);
            return (
              <div key={appointment.id} className="p-4 flex flex-col gap-3 active:bg-muted/50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-foreground">{getPatientName(appointment.patientId)}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{doctor?.name || appointment.doctorId}</p>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Time</span>
                    <span className="text-foreground font-mono text-xs">{appointment.time}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Type</span>
                    <span className="text-foreground">{appointment.type}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Dept</span>
                    <span className="text-foreground">{doctor?.department || '-'}</span>
                  </div>
                </div>
                {(appointment.remarks || appointment.prescription) && (
                  <div className="mt-2 text-xs border-t border-border/50 pt-2">
                    {appointment.remarks && <p className="text-foreground/80"><span className="text-muted-foreground">Notes:</span> {appointment.remarks}</p>}
                    {appointment.prescription && <p className="text-primary mt-1"><span className="text-muted-foreground">Rx:</span> {appointment.prescription}</p>}
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-border/50 flex justify-end">
                  <button 
                    onClick={() => setEditingAppointment(appointment)}
                    className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg flex items-center gap-1 font-medium transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              </div>
            );
          })}
          {appointments.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No appointments found.
            </div>
          )}
        </div>
      </div>

      <BookAppointmentModal 
        open={isBookModalOpen} 
        onOpenChange={setIsBookModalOpen} 
      />

      <EditAppointmentModal 
        open={editingAppointment !== null}
        onOpenChange={(open) => !open && setEditingAppointment(null)}
        appointment={editingAppointment}
      />
    </div>
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
