import React, { useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Stethoscope, 
  Calendar, 
  AlertTriangle, 
  FileText, 
  TestTube, 
  Pill, 
  CreditCard, 
  Box, 
  BarChart3, 
  Bell,
  Search,
  Bot,
  LogOut
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "../store/useAuthStore";
import { useHospitalStore } from "../store/useHospitalStore";
import type { Role } from "../types/auth";
import { useTranslation } from "../translations";
import { Settings as SettingsIcon } from "lucide-react";

type NavItem = {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
  roles: Role[];
};

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", roles: ['admin', 'doctor', 'user', 'receptionist', 'nurse', 'laboratory', 'pharmacy'] },
  { icon: Users, label: "Patients", path: "/patients", roles: ['admin', 'doctor', 'receptionist', 'nurse'] },
  { icon: Stethoscope, label: "Doctors", path: "/doctors", roles: ['admin', 'receptionist'] },
  { icon: Calendar, label: "Appointments", path: "/appointments", roles: ['admin', 'doctor', 'user', 'receptionist'] },
  { icon: AlertTriangle, label: "Emergency", path: "/emergency", badge: 17, roles: ['admin', 'receptionist', 'nurse'] },
  { icon: FileText, label: "Medical Records", path: "/medical-records", roles: ['admin', 'doctor', 'user', 'nurse'] },
  { icon: TestTube, label: "Laboratory", path: "/laboratory", badge: 38, roles: ['admin', 'laboratory'] },
  { icon: Pill, label: "Pharmacy", path: "/pharmacy", badge: 24, roles: ['admin', 'pharmacy'] },
  { icon: CreditCard, label: "Billing", path: "/billing", roles: ['admin', 'user'] },
  { icon: Box, label: "Inventory", path: "/inventory", roles: ['admin', 'pharmacy'] },
  { icon: BarChart3, label: "analytics", path: "/analytics", roles: ['admin'] },
  { icon: SettingsIcon, label: "settings", path: "/settings", roles: ['admin', 'doctor', 'user', 'receptionist', 'nurse', 'laboratory', 'pharmacy'] },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const notifications = useHospitalStore(state => state.notifications);
  const { t } = useTranslation();
  
  const unreadCount = notifications.filter(n => !n.isRead && (n.userId === user?.id || n.userId === 'global')).length;

  const [showAiWidget, setShowAiWidget] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    logout();
  };

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-border bg-card/30 backdrop-blur-md">
        <div className="p-6 flex items-center gap-3 border-b border-border/50">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-widest text-foreground">HOSPITAL<span className="text-primary font-black">OS</span></h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">St. Jude Medical</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-1 px-3 custom-scrollbar">
          <div className="px-3 pb-2 text-[10px] font-bold text-muted-foreground tracking-wider">{t('workspace')}</div>
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive || (item.path === '/' && location.pathname === `/${user?.role}`)
                    ? "bg-muted/80 text-foreground shadow-sm border border-border/50" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <item.icon className="w-4 h-4 opacity-70" />
              <span className="flex-1">{t(item.label.toLowerCase()) || item.label}</span>
              {item.badge && (
                <span className="bg-muted/80 text-xs px-2 py-0.5 rounded-full">{item.badge}</span>
              )}
            </NavLink>
          ))}
          
          <div className="px-3 pt-6 pb-2 text-[10px] font-bold text-muted-foreground tracking-wider">{t('system')}</div>
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive ? "bg-muted/80 text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`
            }
          >
            <Bell className="w-4 h-4 opacity-70" />
            <span className="flex-1">{t('notifications')}</span>
            {unreadCount > 0 && (
              <span className="bg-primary text-foreground text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </NavLink>
        </div>

        {/* User Profile Bottom */}
        <div className="p-4 border-t border-border/50 space-y-2">
          <div 
            onClick={() => navigate('/settings')}
            className="flex items-center gap-3 bg-muted p-3 rounded-xl border border-border/50 cursor-pointer hover:bg-muted/80 transition-colors"
          >
            <Avatar className={`w-10 h-10 border border-primary/30 ${user?.avatar || 'bg-primary/20'}`}>
              <AvatarFallback className="bg-transparent text-foreground font-semibold">
                {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-muted-foreground truncate capitalize">{user?.role} {user?.department ? `• ${user.department}` : ''}</p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            {t('sign_out')}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-card/40 via-background to-background">
        {/* Topbar */}
        <header className="h-16 border-b border-border/50 flex items-center justify-between px-6 bg-card/20 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search records, vitals, or commands..." 
                className="w-full bg-muted border border-border rounded-full py-2 pl-10 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="hidden sm:inline-flex items-center gap-1 bg-muted/80 border border-border rounded px-1.5 text-[10px] font-medium text-muted-foreground">⌘K</kbd>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/notifications')}
              className="relative w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all border border-border/50"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive animate-pulse" />
              )}
            </button>
            <div 
              onClick={() => navigate('/settings')}
              className="w-10 h-10 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center cursor-pointer hover:bg-primary/30 transition-colors"
            >
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-transparent text-primary text-sm font-semibold">
                  {user?.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            <button 
              onClick={() => setShowAiWidget(!showAiWidget)}
              className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center text-foreground shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all"
            >
              <Bot className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          <Outlet />
          
          <FloatingAIWidget show={showAiWidget} />
        </main>
      </div>
    </div>
  );
}

import { X, Send, Loader2 } from 'lucide-react';
import { AIService } from '../services/AIService';

function FloatingAIWidget({ show }: { show: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  if (!show) return null;

  const handleAsk = async () => {
    if (!query) return;
    const userQ = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userQ }]);
    setIsLoading(true);
    
    const response = await AIService.getAIResponse(userQ, "You are the global HospitalOS Assistant. Help the user navigate or understand features.");
    
    setMessages(prev => [...prev, { role: 'ai', content: response }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col h-96">
          <div className="p-4 border-b border-border/50 bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground text-sm">System Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground mt-10">
                How can I help you navigate HospitalOS today?
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-xl p-3 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border text-foreground'}`}>
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
          
          <div className="p-3 border-t border-border/50 bg-background/50 flex gap-2">
            <input 
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk()}
              placeholder="Ask anything..."
              className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 text-foreground"
            />
            <button 
              onClick={handleAsk}
              disabled={isLoading || !query}
              className="bg-primary text-primary-foreground p-2 rounded-lg flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <div 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-3 bg-card border border-border rounded-full py-2.5 px-5 shadow-2xl backdrop-blur-xl hover:border-primary/50 transition-colors cursor-pointer group"
        >
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-foreground/90 group-hover:text-foreground">System ready. Ask anything...</span>
          <kbd className="hidden sm:inline-flex items-center gap-1 bg-muted/80 border border-border rounded px-1.5 text-[10px] font-medium text-muted-foreground ml-2">⌘J</kbd>
        </div>
      )}
    </div>
  );
}
