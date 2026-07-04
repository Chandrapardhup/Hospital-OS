import React, { useState } from "react";
import { 
  UserPlus, 
  CalendarPlus, 
  AlertTriangle, 
  FileText, 
  Upload, 
  UserCheck,
  Bot
} from "lucide-react";
import { useAuthStore } from '../store/useAuthStore';
import { useHospitalStore } from '../store/useHospitalStore';
import { useTranslation } from '../translations';
import { AddPatientDrawer } from '../components/patients/AddPatientDrawer';
import { BookAppointmentModal } from '../components/appointments/BookAppointmentModal';
import { UploadDocumentModal } from '../components/UploadDocumentModal';
import { AssignDoctorModal } from '../components/AssignDoctorModal';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const user = useAuthStore(state => state.user);
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAssignDoctorOpen, setIsAssignDoctorOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          <span>{user?.name}</span>
          <span className="text-foreground/20">•</span>
          <span className="text-primary">{t('command_center')}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">{t('hospital_overview')}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t('welcome_back')}, {user?.name.split(' ')[0]}.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button 
          onClick={() => setIsAddPatientOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <UserPlus className="w-4 h-4 text-primary" /> Register Patient
        </button>
        <button 
          onClick={() => setIsBookModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <CalendarPlus className="w-4 h-4 text-primary" /> Book Appointment
        </button>
        <button 
          onClick={() => navigate('/emergency')}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <AlertTriangle className="w-4 h-4 text-destructive" /> Emergency Check-In
        </button>
        <button 
          onClick={() => navigate('/billing')}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <FileText className="w-4 h-4 text-primary" /> Generate Invoice
        </button>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <Upload className="w-4 h-4 text-primary" /> Upload Report
        </button>
        <button 
          onClick={() => setIsAssignDoctorOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <UserCheck className="w-4 h-4 text-primary" /> Assign Doctor
        </button>
      </div>

      {/* AI COMMAND CENTER PANEL */}
      <div className="mt-8 bg-[#0F111A] border border-primary/20 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_40px_-15px_rgba(168,85,247,0.2)]">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                AI Command Center · Chief Operating Intelligence
              </div>
              <h2 className="text-xl font-bold text-foreground">6 operational insights require your attention</h2>
            </div>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Bot className="w-3.5 h-3.5" /> Reasoning across 42 data streams
          </div>
        </div>

        {/* Scores Grid */}
        <div className="grid grid-cols-4 gap-4 relative z-10 mb-8">
          <ScoreCard title="HOSPITAL HEALTH" score={98} color="text-emerald-400" stroke="stroke-emerald-400" />
          <ScoreCard title="OPERATIONAL" score={92} color="text-primary" stroke="stroke-primary" />
          <ScoreCard title="PERFORMANCE" score={87} color="text-blue-400" stroke="stroke-blue-400" />
          <ScoreCard title="SATISFACTION" score={94} color="text-amber-400" stroke="stroke-amber-400" />
        </div>

        {/* Alerts Grid */}
        <div className="grid grid-cols-3 gap-4 relative z-10">
          <AlertCard 
            type="CRITICAL" 
            title="ICU occupancy has reached 92%" 
            desc="Predicted overflow in 2h. Reroute non-trauma admits to Ward 6."
            action="Reroute now"
          />
          <AlertCard 
            type="WARNING" 
            title="Cardiology is overloaded" 
            desc="Dr. Thorne + Dr. Adeyemi at 140% capacity. Shift 3 patients to Dr. Vale."
            action="Balance load"
          />
          <AlertCard 
            type="CRITICAL" 
            title="3 patients require immediate review" 
            desc="Elena Vance, Marcus Thorne, Priya Rao — vitals trending unstable."
            action="Open triage"
          />
        </div>
      </div>

      <AddPatientDrawer 
        open={isAddPatientOpen} 
        onOpenChange={setIsAddPatientOpen} 
      />
      <BookAppointmentModal 
        open={isBookModalOpen} 
        onOpenChange={setIsBookModalOpen} 
      />
      <UploadDocumentModal 
        open={isUploadModalOpen} 
        onOpenChange={setIsUploadModalOpen} 
      />
      <AssignDoctorModal
        open={isAssignDoctorOpen}
        onOpenChange={setIsAssignDoctorOpen}
      />
    </div>
  );
}

function ScoreCard({ title, score, color, stroke }: { title: string; score: number; color: string; stroke: string }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-card/40 border border-border/50 rounded-xl p-5 flex items-center gap-5 backdrop-blur-sm">
      <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={radius} className="stroke-white/10" strokeWidth="6" fill="none" />
          {/* Progress circle */}
          <circle 
            cx="32" cy="32" r={radius} 
            className={`${stroke}`} 
            strokeWidth="6" fill="none" 
            strokeLinecap="round"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              transition: "stroke-dashoffset 1s ease-in-out"
            }}
          />
        </svg>
        <span className="absolute text-lg font-bold text-foreground">{score}%</span>
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
        <p className="text-xl font-bold text-foreground">Score</p>
        <p className="text-xs text-emerald-500/80 font-medium mt-1">Optimal range</p>
      </div>
    </div>
  );
}

function AlertCard({ type, title, desc, action }: { type: "CRITICAL" | "WARNING" | "INFO"; title: string; desc: string; action: string }) {
  const isCritical = type === "CRITICAL";
  const colorClass = isCritical ? "text-destructive" : "text-amber-500";
  const bgClass = isCritical ? "bg-destructive/10" : "bg-amber-500/10";
  const dotClass = isCritical ? "bg-destructive" : "bg-amber-500";

  return (
    <div className="bg-card/40 border border-border/50 rounded-xl p-5 backdrop-blur-sm flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass} animate-pulse`} />
        <span className={`text-[10px] font-bold uppercase tracking-wider ${colorClass}`}>{type}</span>
      </div>
      <h3 className="text-sm font-bold text-foreground mb-2">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed flex-1">{desc}</p>
      <button className={`mt-4 text-xs font-medium ${colorClass} hover:text-foreground transition-colors flex items-center gap-1 w-fit`}>
        {action} &rarr;
      </button>
    </div>
  );
}
