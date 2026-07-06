import React, { useState } from 'react';
import { Users, AlertTriangle, TestTube, Pill, Calendar, Clock, Activity, CalendarPlus, Search, CreditCard, CheckCircle } from 'lucide-react';
import { AddPatientDrawer } from '../../components/patients/AddPatientDrawer';
import { BookAppointmentModal } from '../../components/appointments/BookAppointmentModal';
import { useTranslation } from '../../translations';
import { useHospitalStore } from '../../store/useHospitalStore';

import { AssignDoctorModal } from '../../components/AssignDoctorModal';

export function ReceptionDashboard() {
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  
  const patients = useHospitalStore(state => state.patients);
  const appointments = useHospitalStore(state => state.appointments);
  const invoices = useHospitalStore(state => state.invoices);
  const updateAppointment = useHospitalStore(state => state.updateAppointment);
  
  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || id;
  const getDoctorName = (id: string) => useHospitalStore.getState().doctors.find(d => d.id === id)?.name || id;

  // Real stats
  const today = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.date === today);
  const waitlistCount = todayAppointments.filter(a => a.status === 'Scheduled').length;
  const todayCheckins = todayAppointments.filter(a => ['Waiting', 'In Progress', 'Completed'].includes(a.status)).length;
  const pendingBills = invoices?.filter(i => i.status === 'Pending').length || 0;

  const filteredAppointments = todayAppointments.filter(a => 
    getPatientName(a.patientId).toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCheckIn = (id: string) => {
    // Generate a random token number like A-12
    const prefix = String.fromCharCode(65 + Math.floor(Math.random() * 5)); // A to E
    const num = Math.floor(Math.random() * 99) + 1;
    const token = `${prefix}-${num.toString().padStart(2, '0')}`;
    
    updateAppointment(id, { status: 'Waiting', tokenNumber: token });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Reception Desk</h1>
          <p className="text-muted-foreground mt-1">Manage patient intake, token queues, and front-desk operations.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => setIsAssignModalOpen(true)}
            className="px-4 py-2 border border-blue-500/50 hover:bg-blue-500/10 text-blue-500 font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> Assign Doctor
          </button>
          <button 
            onClick={() => setIsBookModalOpen(true)}
            className="px-4 py-2 border border-border hover:bg-muted text-foreground font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            <CalendarPlus className="w-4 h-4" /> {t('book_appointment')}
          </button>
          <button 
            onClick={() => setIsAddDrawerOpen(true)}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-colors flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> Walk-in Registration
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-6 md:mt-8">
        <div className="bg-card/40 border border-border/50 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-lg font-bold text-foreground">Pending Arrivals</h3>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-foreground relative z-10">{waitlistCount}</p>
          <p className="text-sm text-muted-foreground mt-1 relative z-10">Scheduled for today</p>
        </div>
        <div className="bg-card/40 border border-border/50 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-lg font-bold text-foreground">Total Checked-in</h3>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-foreground relative z-10">{todayCheckins}</p>
          <p className="text-sm text-muted-foreground mt-1 relative z-10">Patients processed</p>
        </div>
        <div className="bg-card/40 border border-border/50 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-lg font-bold text-foreground">Pending Bills</h3>
            <CreditCard className="w-5 h-5 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-foreground relative z-10">{pendingBills}</p>
          <p className="text-sm text-muted-foreground mt-1 relative z-10">Invoices awaiting payment</p>
        </div>
        <div className="bg-card/40 border border-border/50 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <h3 className="text-lg font-bold text-foreground">Total Database</h3>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-foreground relative z-10">{patients.length}</p>
          <p className="text-sm text-muted-foreground mt-1 relative z-10">Registered patients</p>
        </div>
      </div>

      <div className="bg-card/30 border border-border rounded-2xl backdrop-blur-md overflow-hidden mt-6">
        <div className="p-4 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-foreground px-2">Today's Live Queue</h2>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by patient name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background/50 border border-border rounded-full py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-background/50">
              <tr>
                <th className="px-6 py-4 font-bold">TIME</th>
                <th className="px-6 py-4 font-bold">PATIENT</th>
                <th className="px-6 py-4 font-bold">DOCTOR</th>
                <th className="px-6 py-4 font-bold">STATUS</th>
                <th className="px-6 py-4 font-bold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment) => (
                  <tr key={appointment.id} className="hover:bg-muted/50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-foreground text-xs">
                      {appointment.time}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{getPatientName(appointment.patientId)}</div>
                      <div className="text-xs text-muted-foreground">{appointment.type}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      Dr. {getDoctorName(appointment.doctorId)}
                    </td>
                    <td className="px-6 py-4">
                      {appointment.status === 'Waiting' ? (
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                          </span>
                          <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border bg-blue-500/10 text-blue-500 border-blue-500/20">
                            Token: {appointment.tokenNumber}
                          </span>
                        </div>
                      ) : appointment.status === 'In Progress' ? (
                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border bg-primary/10 text-primary border-primary/20">
                          With Doctor
                        </span>
                      ) : appointment.status === 'Completed' ? (
                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                          Completed
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border bg-amber-500/10 text-amber-500 border-amber-500/20">
                          {appointment.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {appointment.status === 'Scheduled' && (
                        <button 
                          onClick={() => handleCheckIn(appointment.id)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2 text-xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Check In & Generate Token
                        </button>
                      )}
                      {appointment.status === 'Waiting' && (
                        <span className="text-xs text-muted-foreground italic">Waiting in Lobby</span>
                      )}
                      {appointment.status === 'In Progress' && (
                        <span className="text-xs text-primary italic">Inside Cabin</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No appointments scheduled for today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddPatientDrawer open={isAddDrawerOpen} onOpenChange={setIsAddDrawerOpen} />
      <BookAppointmentModal open={isBookModalOpen} onOpenChange={setIsBookModalOpen} />
      <AssignDoctorModal open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen} />
    </div>
  );
}


export function NurseDashboard() {
  const patients = useHospitalStore(state => state.patients);
  const criticalCount = patients.filter(p => p.status === 'Emergency').length;
  const admittedCount = patients.filter(p => p.status === 'Admitted').length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Nursing Station</h1>
          <p className="text-muted-foreground mt-1">Monitor patient vitals and ward assignments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">
        <div className="bg-card/40 border border-border/50 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-foreground">Critical Patients</h3>
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <p className="text-3xl font-bold text-foreground">{criticalCount}</p>
          <p className="text-sm text-muted-foreground mt-1">Require immediate rounds</p>
        </div>
        <div className="bg-card/40 border border-border/50 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-foreground">My Ward (ICU)</h3>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">{admittedCount}/15</p>
          <p className="text-sm text-emerald-500 mt-1">Beds occupied</p>
        </div>
      </div>
    </div>
  );
}

export function LabDashboard() {
  const appointments = useHospitalStore(state => state.appointments);
  const patients = useHospitalStore(state => state.patients);
  const [completedTests, setCompletedTests] = useState<string[]>([]);

  // Generate dynamic lab tests from appointments with actual lab requests
  const pendingTests = appointments
    .filter(a => a.status === 'Completed' && a.labRequest && !completedTests.includes(a.id))
    .map(a => ({
      id: a.id,
      patientName: patients.find(p => p.id === a.patientId)?.name || 'Unknown Patient',
      testType: a.labRequest,
      date: new Date(a.date).toLocaleDateString()
    }));

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Laboratory</h1>
        <p className="text-muted-foreground mt-1">Process test samples and publish results.</p>
      </div>

      {pendingTests.length === 0 ? (
        <div className="bg-card/30 border border-border rounded-2xl p-8 text-center mt-8">
          <TestTube className="w-12 h-12 text-primary mx-auto mb-4 opacity-80" />
          <h2 className="text-xl font-bold text-foreground mb-2">Queue Empty</h2>
          <p className="text-muted-foreground">There are no pending lab requests at the moment.</p>
        </div>
      ) : (
        <div className="bg-card/30 border border-border rounded-2xl overflow-hidden mt-8">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase tracking-widest text-muted-foreground bg-background/50">
              <tr>
                <th className="px-6 py-4 font-bold">PATIENT</th>
                <th className="px-6 py-4 font-bold">TEST TYPE</th>
                <th className="px-6 py-4 font-bold">REQUEST DATE</th>
                <th className="px-6 py-4 font-bold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pendingTests.map(test => (
                <tr key={test.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{test.patientName}</td>
                  <td className="px-6 py-4 text-foreground">{test.testType}</td>
                  <td className="px-6 py-4 text-muted-foreground">{test.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setCompletedTests([...completedTests, test.id])}
                      className="px-4 py-1.5 bg-primary/10 text-primary font-medium text-xs rounded-lg hover:bg-primary/20 transition-colors"
                    >
                      Mark Completed
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { Loader2, Send, CheckCircle2 } from 'lucide-react';
import { AIService } from '../../services/AIService';

export function PharmacyDashboard() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dispensed, setDispensed] = useState<string[]>([]);
  
  const appointments = useHospitalStore(state => state.appointments);
  const patients = useHospitalStore(state => state.patients);

  // Generate dynamic prescriptions from completed appointments with actual prescriptions
  const activePrescriptions = appointments
    .filter(a => a.status === 'Completed' && a.prescription && !dispensed.includes(a.id))
    .map(a => ({
      id: a.id,
      patientName: patients.find(p => p.id === a.patientId)?.name || 'Unknown Patient',
      medication: a.prescription,
      instructions: 'As prescribed by doctor'
    }));

  const handleAskAI = async () => {
    if (!query) return;
    setIsLoading(true);
    const res = await AIService.getAIResponse(query, "You are a Pharmacy AI Assistant for a hospital. Give SHORT, CONCISE answers (2-4 sentences max). Focus strictly on: medicine names, dosages, drug interactions, side effects, prescription guidance, and medication scheduling. Do not give long paragraphs. Be direct and clinical. If asked about non-medicine topics, politely redirect to pharmacy-related queries only.");
    setResponse(res);
    setIsLoading(false);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Pharmacy</h1>
        <p className="text-muted-foreground mt-1">Dispense medications and manage inventory.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8">
        <div className="bg-card/40 border border-border rounded-2xl p-6 flex flex-col h-[450px]">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Pill className="w-4 h-4 text-primary" /> Active Prescriptions
          </h3>
          
          {activePrescriptions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4 opacity-80" />
              <h2 className="text-lg font-bold text-foreground mb-1">All Caught Up</h2>
              <p className="text-sm text-muted-foreground">No active prescriptions to dispense.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {activePrescriptions.map(rx => (
                <div key={rx.id} className="p-4 bg-background border border-border rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-foreground">{rx.patientName}</h4>
                    <button 
                      onClick={() => setDispensed([...dispensed, rx.id])}
                      className="text-xs bg-emerald-500/10 text-emerald-500 font-medium px-2 py-1 rounded-md hover:bg-emerald-500/20 transition-colors"
                    >
                      Dispense
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-primary">{rx.medication}</p>
                  <p className="text-xs text-muted-foreground mt-1">{rx.instructions}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card/40 border border-border rounded-2xl p-6 flex flex-col h-[450px]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-bold text-xs">AI</span>
            </div>
            <h3 className="font-semibold text-foreground">Pharmacist Assistant</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto mb-4 p-4 rounded-xl bg-background/50 border border-border text-sm text-foreground whitespace-pre-wrap">
            {response || "Ask me about drug interactions, side effects, or dosing guidelines..."}
          </div>
          
          <div className="flex gap-2">
            <input 
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAskAI()}
              placeholder="e.g. Interaction between Amoxicillin and Ibuprofen?"
              className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
            />
            <button 
              onClick={handleAskAI}
              disabled={isLoading}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl flex items-center justify-center transition-colors"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
