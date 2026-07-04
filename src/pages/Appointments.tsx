import React, { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { useHospitalStore } from "../store/useHospitalStore";
import type { AppointmentStatus } from "../types/hospital";
import { BookAppointmentModal } from "../components/appointments/BookAppointmentModal";

export default function Appointments() {
  const appointments = useHospitalStore(state => state.appointments);
  const patients = useHospitalStore(state => state.patients);
  const doctors = useHospitalStore(state => state.doctors);
  
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

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
        <div className="flex items-center justify-between mt-1">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Appointments</h1>
            <p className="text-sm text-muted-foreground mt-1">Today · {todayCount} scheduled · {completedCount} completed</p>
          </div>
          <button 
            onClick={() => setIsBookModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-foreground font-medium rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all"
          >
            <CalendarPlus className="w-5 h-5" /> Book appointment
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mt-8">
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-background/50">
              <tr>
                <th className="px-6 py-4 font-bold">TIME</th>
                <th className="px-6 py-4 font-bold">PATIENT</th>
                <th className="px-6 py-4 font-bold">DOCTOR</th>
                <th className="px-6 py-4 font-bold">DEPARTMENT</th>
                <th className="px-6 py-4 font-bold">TYPE</th>
                <th className="px-6 py-4 font-bold">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {appointments.map((appointment) => {
                const doctor = getDoctor(appointment.doctorId);
                return (
                  <tr key={appointment.id} className="hover:bg-muted transition-colors cursor-pointer group">
                    <td className="px-6 py-4 font-mono text-foreground text-xs">{appointment.time}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{getPatientName(appointment.patientId)}</td>
                    <td className="px-6 py-4 text-muted-foreground">{doctor?.name || appointment.doctorId}</td>
                    <td className="px-6 py-4 text-muted-foreground">{doctor?.department || '-'}</td>
                    <td className="px-6 py-4 text-muted-foreground">{appointment.type}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={appointment.status} />
                    </td>
                  </tr>
                );
              })}
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No appointments found.
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
