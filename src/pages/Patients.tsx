import React, { useState } from "react";
import { UserPlus, Search } from "lucide-react";
import { useHospitalStore } from "../store/useHospitalStore";
import type { PatientStatus } from "../types/hospital";
import { AddPatientDrawer } from "../components/patients/AddPatientDrawer";

export default function Patients() {
  const patients = useHospitalStore(state => state.patients);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const admittedCount = patients.filter(p => p.status === 'Admitted').length;
  const emergencyCount = patients.filter(p => p.status === 'Emergency').length;
  const dischargedCount = patients.filter(p => p.status === 'Discharged').length;
  const outpatientCount = patients.filter(p => p.status === 'Outpatient').length;

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
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Patients</h1>
            <p className="text-sm text-muted-foreground mt-1">Live census · {patients.length} total patients registered</p>
          </div>
          <button 
            onClick={() => setIsAddDrawerOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-foreground font-medium rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all w-full sm:w-auto justify-center min-h-[48px]"
          >
            <UserPlus className="w-5 h-5" /> Register patient
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 md:mt-8">
        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Admitted</p>
          <div className="text-3xl font-bold text-foreground mb-2">{admittedCount}</div>
          <p className="text-xs font-medium text-primary">In wards</p>
        </div>
        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Emergency</p>
          <div className="text-3xl font-bold text-foreground mb-2">{emergencyCount}</div>
          <p className="text-xs font-medium text-destructive">Requires attention</p>
        </div>
        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Outpatient</p>
          <div className="text-3xl font-bold text-foreground mb-2">{outpatientCount}</div>
          <p className="text-xs font-medium text-amber-500">Consultations</p>
        </div>
        <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Discharged</p>
          <div className="text-3xl font-bold text-foreground mb-2">{dischargedCount}</div>
          <p className="text-xs font-medium text-emerald-500">Successfully recovered</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-card/30 border border-border rounded-2xl backdrop-blur-md overflow-hidden mt-6">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background/50 border border-border rounded-full py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <button className="text-foreground border-b-2 border-primary pb-1">ALL</button>
          </div>
        </div>
        
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-background/50">
              <tr>
                <th className="px-6 py-4 font-bold">ID</th>
                <th className="px-6 py-4 font-bold">Patient</th>
                <th className="px-6 py-4 font-bold">Gender</th>
                <th className="px-6 py-4 font-bold">Phone</th>
                <th className="px-6 py-4 font-bold">Blood Group</th>
                <th className="px-6 py-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-muted transition-colors cursor-pointer group">
                  <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{patient.id}</td>
                  <td className="px-6 py-4 font-medium text-foreground">{patient.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{patient.gender}</td>
                  <td className="px-6 py-4 text-muted-foreground">{patient.phone}</td>
                  <td className="px-6 py-4 text-muted-foreground">{patient.bloodGroup}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={patient.status} />
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    No patients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden flex flex-col divide-y divide-border">
          {filteredPatients.map((patient) => (
            <div key={patient.id} className="p-4 flex flex-col gap-3 hover:bg-muted/50 active:bg-muted transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-foreground">{patient.name}</h3>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">{patient.id}</p>
                </div>
                <StatusBadge status={patient.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Phone</span>
                  <span className="text-foreground">{patient.phone}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Blood Group</span>
                  <span className="text-foreground">{patient.bloodGroup}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Gender</span>
                  <span className="text-foreground">{patient.gender}</span>
                </div>
              </div>
            </div>
          ))}
          {filteredPatients.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No patients found.
            </div>
          )}
        </div>
      </div>

      <AddPatientDrawer 
        open={isAddDrawerOpen} 
        onOpenChange={setIsAddDrawerOpen} 
      />
    </div>
  );
}

function StatusBadge({ status }: { status: PatientStatus }) {
  const styles = {
    Emergency: "bg-destructive/10 text-destructive border-destructive/20",
    Outpatient: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    Discharged: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    Admitted: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };

  return (
    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${styles[status]}`}>
      {status}
    </span>
  );
}
