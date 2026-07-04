import React, { useState } from 'react';
import { Users, AlertTriangle, TestTube, Pill, Calendar, Clock, Activity, CalendarPlus } from 'lucide-react';
import { AddPatientDrawer } from '../../components/patients/AddPatientDrawer';
import { BookAppointmentModal } from '../../components/appointments/BookAppointmentModal';
import { useTranslation } from '../../translations';

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

      <div className="grid grid-cols-3 gap-6 mt-8">
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

      <div className="grid grid-cols-3 gap-6 mt-8">
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
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Laboratory</h1>
        <p className="text-muted-foreground mt-1">Process test samples and publish results.</p>
      </div>

      <div className="bg-card/30 border border-border rounded-2xl p-8 text-center mt-8">
        <TestTube className="w-12 h-12 text-primary mx-auto mb-4 opacity-80" />
        <h2 className="text-xl font-bold text-foreground mb-2">Queue Empty</h2>
        <p className="text-muted-foreground">There are no pending lab requests at the moment.</p>
      </div>
    </div>
  );
}

import { Loader2, Send } from 'lucide-react';
import { AIService } from '../../services/AIService';

export function PharmacyDashboard() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAskAI = async () => {
    if (!query) return;
    setIsLoading(true);
    const res = await AIService.getAIResponse(query, "You are an AI Pharmacist Assistant. Help answer questions about drug interactions, dosages, and side effects. Provide authoritative data.");
    setResponse(res);
    setIsLoading(false);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Pharmacy</h1>
        <p className="text-muted-foreground mt-1">Dispense medications and manage inventory.</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-8">
        <div className="bg-card/30 border border-border rounded-2xl p-8 text-center h-[300px] flex flex-col items-center justify-center">
          <Pill className="w-12 h-12 text-primary mx-auto mb-4 opacity-80" />
          <h2 className="text-xl font-bold text-foreground mb-2">No Active Prescriptions</h2>
          <p className="text-muted-foreground">All pending medication requests have been fulfilled.</p>
        </div>

        <div className="bg-card/40 border border-border rounded-2xl p-6 flex flex-col h-[400px]">
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
