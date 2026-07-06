import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Users, 
  Stethoscope, 
  Calendar, 
  AlertTriangle, 
  FileText as FileTextIcon, 
  TestTube, 
  Pill, 
  CreditCard, 
  Box, 
  BarChart3, 
  Bell,
  Search,
  Bot,
  LogOut,
  BrainCircuit,
  Network,
  Mail,
  Menu,
  X,
  Send,
  Loader2,
  Video
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "../store/useAuthStore";
import { useHospitalStore } from "../store/useHospitalStore";
import type { Role } from "../types/auth";
import { useTranslation } from "../translations";
import { Settings as SettingsIcon } from "lucide-react";
import { AIService } from '../services/AIService';
import { supabase } from '../lib/supabase';

type NavItem = {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
  roles: Role[];
};

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", roles: ['admin', 'doctor', 'user', 'receptionist', 'nurse', 'laboratory', 'pharmacy'] },
  
  // Enterprise AI Features (Admin Only)
  { icon: BrainCircuit, label: "Hospital Brain", path: "/admin/brain", roles: ['admin'] },
  { icon: Network, label: "Workflows", path: "/admin/workflows", roles: ['admin'] },
  { icon: FileTextIcon, label: "Daily Briefing", path: "/admin/briefing", roles: ['admin'] },
  
  // Core Modules
  { icon: Users, label: "Patients", path: "/patients", roles: ['admin', 'doctor', 'receptionist', 'nurse'] },
  { icon: Stethoscope, label: "Doctors", path: "/doctors", roles: ['admin', 'receptionist'] },
  { icon: Calendar, label: "Appointments", path: "/appointments", roles: ['admin', 'doctor', 'user', 'receptionist'] },
  { icon: AlertTriangle, label: "Emergency", path: "/emergency", roles: ['admin', 'doctor', 'receptionist', 'nurse'] },
  { icon: FileTextIcon, label: "Medical Records", path: "/medical-records", roles: ['admin', 'user', 'nurse'] },
  { icon: Video, label: "AI Live Consult", path: "/ai-consult", roles: ['user'] },
  { icon: TestTube, label: "Laboratory", path: "/laboratory", roles: ['admin', 'doctor', 'nurse', 'laboratory'] },
  { icon: Pill, label: "Pharmacy", path: "/pharmacy", roles: ['admin', 'doctor', 'nurse', 'pharmacy'] },
  { icon: CreditCard, label: "Billing", path: "/billing", roles: ['admin', 'receptionist', 'user'] },
  { icon: Box, label: "Inventory", path: "/inventory", roles: ['admin', 'pharmacy', 'nurse'] },
  { icon: BarChart3, label: "analytics", path: "/analytics", roles: ['admin'] },
  { icon: SettingsIcon, label: "settings", path: "/settings", roles: ['admin', 'doctor', 'user', 'receptionist', 'nurse', 'laboratory', 'pharmacy'] },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const notifications = useHospitalStore(state => state.notifications);
  const patients = useHospitalStore(state => state.patients);
  const { t } = useTranslation();
  
  const currentPatientId = patients.find(p => p.email === user?.email)?.id;
  const unreadCount = notifications.filter(n => !n.isRead && (n.userId === user?.id || n.userId === currentPatientId || n.userId === 'global')).length;

  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  
  // Auto-close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Detect iOS browser (not standalone PWA)
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    
    if (isIOS && !isStandalone) {
      setShowIOSPrompt(true);
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
  };

  // Global Emergency Logic for Doctors
  const doctors = useHospitalStore(state => state.doctors);
  const appointments = useHospitalStore(state => state.appointments);
  const currentDoctor = doctors.find(d => d.email === user?.email);
  const myAppointments = currentDoctor ? appointments.filter(a => a.doctorId === currentDoctor.id) : [];
  
  const [dismissedEmergencies, setDismissedEmergenciesState] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('hospitalos_dismissed_emergencies');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const setDismissedEmergencies = (newIds: string[]) => {
    setDismissedEmergenciesState(newIds);
    localStorage.setItem('hospitalos_dismissed_emergencies', JSON.stringify(newIds));
  };

  const activeEmergencies = myAppointments.filter(a => a.type === 'Emergency' && a.status === 'Scheduled' && !dismissedEmergencies.includes(a.id));
  const emergency = activeEmergencies[0];
  const getPatientName = (id: string) => patients.find(p => p.id === id)?.name || id;

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));
  
  // Bottom Nav specific items (Max 5 for mobile)
  const bottomNavItems = [
    { icon: LayoutDashboard, path: "/" },
    { icon: Calendar, path: "/appointments" },
    { icon: CreditCard, path: "/billing" },
    { icon: Bell, path: "/notifications", badge: unreadCount },
    { icon: SettingsIcon, path: "/settings" }
  ].filter(item => {
    // Only show if user has access to this route
    if (item.path === '/notifications' || item.path === '/settings') return true;
    return filteredNavItems.some(n => n.path === item.path);
  }).slice(0, 5);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden pb-16 md:pb-0">
      
      {/* GLOBAL EMERGENCY NOTIFICATION FOR DOCTORS */}
      {user?.role === 'doctor' && emergency && (
        <div className="fixed top-20 right-4 z-[100] max-w-sm w-full animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-card border-2 border-red-500 rounded-2xl p-5 shadow-[0_10px_40px_rgba(239,68,68,0.3)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/20 rounded-full blur-2xl -mr-8 -mt-8 animate-pulse" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-widest text-[10px]">
                <AlertTriangle className="w-4 h-4 animate-pulse" />
                CRITICAL EMERGENCY
              </div>
              <h2 className="text-lg font-bold text-foreground leading-tight">{getPatientName(emergency.patientId)}</h2>
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-500">
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1">Symptoms</p>
                <p className="text-xs line-clamp-2">{emergency.symptoms || 'Immediate evaluation required.'}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => {
                    setDismissedEmergencies([...dismissedEmergencies, emergency.id]);
                    navigate('/emergency');
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-3 text-xs rounded-lg transition-colors text-center"
                >
                  Treat Now
                </button>
                <button 
                  onClick={() => setDismissedEmergencies([...dismissedEmergencies, emergency.id])}
                  className="px-3 py-2 border border-border hover:bg-muted text-foreground font-medium text-xs rounded-lg transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-20 lg:w-64 border-r border-border bg-card/30 backdrop-blur-md transition-all duration-300">
        <div className="p-6 flex items-center gap-3 border-b border-border/50 justify-center lg:justify-start">
          <div className="min-w-[32px] w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-black">
            <img src="/logo.png" alt="HospitalOS Logo" className="w-full h-full object-cover" />
          </div>
          <div className="hidden lg:block">
            <h1 className="font-bold text-sm tracking-widest text-foreground">HOSPITAL<span className="text-primary font-black">OS</span></h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">St. Jude Medical</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-1 px-3 custom-scrollbar">
          <div className="hidden lg:block px-3 pb-2 text-[10px] font-bold text-muted-foreground tracking-wider">{t('workspace')}</div>
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.label}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 justify-center lg:justify-start ${
                  isActive || (item.path === '/' && location.pathname === `/${user?.role}`)
                    ? "bg-muted/80 text-foreground shadow-sm border border-border/50" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <item.icon className="min-w-[16px] w-4 h-4 opacity-70" />
              <span className="hidden lg:block flex-1 truncate">{t(item.label.toLowerCase()) || item.label}</span>
              {item.badge && (
                <span className="hidden lg:inline-block bg-muted/80 text-xs px-2 py-0.5 rounded-full">{item.badge}</span>
              )}
            </NavLink>
          ))}
          
          <div className="hidden lg:block px-3 pt-6 pb-2 text-[10px] font-bold text-muted-foreground tracking-wider">{t('system')}</div>
          <NavLink
            to="/notifications"
            title="Notifications"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 justify-center lg:justify-start ${
                isActive ? "bg-muted/80 text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <div className="relative">
              <Bell className="min-w-[16px] w-4 h-4 opacity-70" />
              {unreadCount > 0 && <span className="lg:hidden absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>}
            </div>
            <span className="hidden lg:block flex-1">{t('notifications')}</span>
            {unreadCount > 0 && (
              <span className="hidden lg:inline-block bg-primary text-foreground text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </NavLink>
        </div>

        {/* User Profile Bottom */}
        <div className="p-4 border-t border-border/50 space-y-2">
          <div 
            onClick={() => navigate('/settings')}
            className="flex items-center gap-3 lg:bg-muted p-2 lg:p-3 rounded-xl lg:border lg:border-border/50 cursor-pointer hover:bg-muted/80 transition-colors justify-center lg:justify-start"
          >
            <Avatar className={`w-10 h-10 border border-primary/30 ${user?.avatar || 'bg-primary/20'}`}>
              <AvatarFallback className="bg-transparent text-foreground font-semibold">
                {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground truncate capitalize">{user?.role} {user?.department ? `• ${user.department}` : ''}</p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={handleLogout}
            title={t('sign_out')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="min-w-[14px] w-3.5 h-3.5" />
            <span className="hidden lg:inline">{t('sign_out')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-card/40 via-background to-background relative w-full">
        {/* iOS PWA Install Prompt */}
        <AnimatePresence>
          {showIOSPrompt && (
            <motion.div 
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="md:hidden bg-primary/10 border-b border-primary/20 px-4 py-3 flex items-start gap-3 z-50"
            >
              <div className="p-2 bg-primary/20 rounded-xl text-primary mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Install HospitalOS</p>
                <p className="text-xs text-muted-foreground mt-0.5">For native push notifications, tap the share button and select <strong>"Add to Home Screen"</strong>.</p>
              </div>
              <button onClick={() => setShowIOSPrompt(false)} className="p-2 -mr-2 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Topbar */}
        <header className="h-16 min-h-[64px] border-b border-border/50 flex items-center justify-between px-4 md:px-6 bg-card/20 backdrop-blur-sm z-10 sticky top-0 w-full">
          
          {/* Mobile Hamburger Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-foreground mr-2"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4 flex-1 max-w-full">
            <div className="relative w-full max-w-sm group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..." 
                className="w-full bg-muted border border-border rounded-full py-2 pl-10 pr-4 md:pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all min-h-[40px]"
              />
              <div className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 items-center gap-1">
                <kbd className="inline-flex items-center gap-1 bg-muted/80 border border-border rounded px-1.5 text-[10px] font-medium text-muted-foreground">⌘K</kbd>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 ml-2">
            <button 
              onClick={() => navigate('/notifications')}
              className="hidden md:flex relative w-10 h-10 rounded-full bg-muted items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all border border-border/50"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive animate-pulse" />
              )}
            </button>
            <div 
              onClick={() => navigate('/settings')}
              className="hidden md:flex w-10 h-10 rounded-full bg-primary/20 border border-primary/50 items-center justify-center cursor-pointer hover:bg-primary/30 transition-colors"
            >
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-transparent text-primary text-sm font-semibold">
                  {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative w-full custom-scrollbar">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            />
            
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="md:hidden fixed top-0 left-0 bottom-0 w-[85vw] max-w-sm bg-card border-r border-border shadow-2xl z-50 flex flex-col"
            >
              <div className="p-4 flex items-center justify-between border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-black">
                    <img src="/logo.png" alt="HospitalOS Logo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h1 className="font-bold text-sm tracking-widest text-foreground">HOSPITAL<span className="text-primary font-black">OS</span></h1>
                  </div>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
                {filteredNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                        isActive || (item.path === '/' && location.pathname === `/${user?.role}`)
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "text-foreground hover:bg-muted"
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5 opacity-70" />
                    <span className="flex-1 truncate">{t(item.label.toLowerCase()) || item.label}</span>
                    {item.badge && (
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">{item.badge}</span>
                    )}
                  </NavLink>
                ))}
              </div>
              
              <div className="p-4 border-t border-border/50">
                <button 
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('sign_out')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border/50 z-30 flex items-center justify-around px-2 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
        {bottomNavItems.map((item, idx) => {
          const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === `/${user?.role}`);
          return (
            <NavLink
              key={idx}
              to={item.path}
              className={`flex flex-col items-center justify-center w-14 h-14 relative ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <item.icon className={`w-6 h-6 ${isActive ? 'fill-primary/20' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              {item.badge ? (
                <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
              ) : null}
            </NavLink>
          )
        })}
      </div>

      <FloatingAIWidget />
    </div>
  );
}

function FloatingAIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAsk = async () => {
    if (!query) return;
    const userQ = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userQ }]);
    setIsLoading(true);
    
    const systemPrompt = `You are the HospitalOS App Assistant.
CRITICAL RULE: You are ONLY allowed to answer questions about how to use this app, navigate the interface, or view billing/records.
IF THE USER ASKS ANY MEDICAL, HEALTH, OR SYMPTOM-RELATED QUESTION:
You MUST refuse to answer and reply EXACTLY with: "I am only an app assistant. For health advice and prescriptions, please go to the Patient Dashboard and use the **AI Video Consultation** ($10 fee) to speak with our AI Doctor."`;

    const response = await AIService.getAIResponse(systemPrompt, userQ);
    
    setMessages(prev => [...prev, { role: 'ai', content: response }]);
    setIsLoading(false);
  };

  return (
    <>
      {/* Mobile Modal Overlay for AI Assistant */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-50 md:inset-auto md:bottom-24 md:right-6 md:w-96 flex flex-col items-end md:items-stretch h-dvh md:h-96 md:rounded-2xl"
          >
            <div className="w-full h-full bg-card border border-border shadow-2xl overflow-hidden flex flex-col md:rounded-2xl">
              <div className="p-4 pt-8 md:pt-4 border-b border-border/50 bg-muted/30 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Bot className="w-6 h-6 md:w-5 md:h-5 text-primary" />
                  <span className="font-semibold text-foreground md:text-sm">System Assistant</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-background border border-border text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5 md:w-4 md:h-4" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 md:pb-4 custom-scrollbar">
                {messages.length === 0 && (
                  <div className="text-center text-sm md:text-sm text-muted-foreground mt-10 px-4">
                    How can I help you navigate HospitalOS today?
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl md:rounded-xl p-3 md:text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border text-foreground'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted border border-border rounded-xl p-3 text-sm flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-3 border-t border-border/50 bg-background/90 backdrop-blur-md flex gap-2 w-full mt-auto mb-safe md:mb-0">
                <input 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAsk()}
                  placeholder="Ask anything..."
                  className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-3 md:py-2 focus:outline-none focus:border-primary/50 text-foreground min-h-[48px] md:min-h-[40px]"
                />
                <button 
                  onClick={handleAsk}
                  disabled={isLoading || !query}
                  className="bg-primary text-primary-foreground p-3 md:p-2 rounded-xl flex items-center justify-center min-w-[48px] md:min-w-[40px] disabled:opacity-50"
                >
                  <Send className="w-5 h-5 md:w-4 md:h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (FAB) for AI Assistant */}
      {!isOpen && (
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40">
          <button 
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 md:w-auto md:h-auto md:py-3 md:px-5 flex items-center justify-center gap-3 bg-card md:bg-card border border-border rounded-full shadow-[0_0_20px_rgba(0,0,0,0.15)] backdrop-blur-xl hover:border-primary/50 transition-colors group"
          >
            <div className="md:hidden w-6 h-6 text-foreground relative flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-ping" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary" />
            </div>
            
            <div className="hidden md:flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-foreground/90 group-hover:text-foreground">System ready. Ask anything...</span>
              <kbd className="hidden sm:inline-flex items-center gap-1 bg-muted/80 border border-border rounded px-1.5 text-[10px] font-medium text-muted-foreground ml-2">⌘J</kbd>
            </div>
          </button>
        </div>
      )}
    </>
  );
}
