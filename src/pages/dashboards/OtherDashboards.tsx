import React, { useState } from 'react';
import { Users, AlertTriangle, TestTube, Pill, Calendar, Clock, Activity, CalendarPlus } from 'lucide-react';
import { AddPatientDrawer } from '../../components/patients/AddPatientDrawer';
import { BookAppointmentModal } from '../../components/appointments/BookAppointmentModal';
import { useTranslation } from '../../translations';
import { useHospitalStore } from '../../store/useHospitalStore';

export function ReceptionDashboard() {
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const { t } = useTranslation();
  
  const patients = useHospitalStore(state => state.patients);
  const appointments = useHospitalStore(state => state.appointments);
  
  // Real stats
  const today = new Date().toISOString().split('T')[0];
  const waitlistCount = appointments.filter(a => a.status === 'Scheduled').length;
  const todayCheckins = appointments.filter(a => a.status === 'Completed' || a.status === 'In Progress').length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Reception Desk</h1>
          <p className="text-muted-foreground mt-1">Manage patient intake and front-desk operations.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsBookModalOpen(true)}
            className="px-4 py-2 border border-border hover:bg-muted text-foreground font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            <CalendarPlus className="w-4 h-4" /> {t('book_appointment')}
          </button>
          <button 
            onClick={() => setIsAddDrawerOpen(true)}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-foreground font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> {t('walkin_registration')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-6 md:mt-8">
        <div className="bg-card/40 border border-border/50 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-foreground">Waitlist</h3>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">{waitlistCount}</p>
          <p className="text-sm text-muted-foreground mt-1">Patients waiting</p>
        </div>
        <div className="bg-card/40 border border-border/50 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-foreground">Today's Check-ins</h3>
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">{todayCheckins}</p>
          <p className="text-sm text-emerald-500 mt-1">Checked in</p>
        </div>
        <div className="bg-card/40 border border-border/50 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-foreground">Total Patients</h3>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">{patients.length}</p>
          <p className="text-sm text-muted-foreground mt-1">Registered in system</p>
        </div>
      </div>

      <AddPatientDrawer open={isAddDrawerOpen} onOpenChange={setIsAddDrawerOpen} />
      <BookAppointmentModal open={isBookModalOpen} onOpenChange={setIsBookModalOpen} />
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
