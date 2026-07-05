import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./store/useAuthStore";
import { useHospitalStore } from "./store/useHospitalStore";
import type { Notification as HospitalNotification } from "./types/hospital";
import { RequireAuth } from "./components/auth/RequireAuth";
import AppLayout from "./layouts/AppLayout";
import LoginPage from "./pages/auth/LoginPage";
import OnboardingFlow from './pages/auth/OnboardingFlow';

// Admin pages
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import MedicalRecords from "./pages/MedicalRecords";

// Role specific dashboards
import DoctorDashboard from "./pages/dashboards/DoctorDashboard";
import PatientDashboard from "./pages/dashboards/PatientDashboard";
import { ReceptionDashboard, NurseDashboard, LabDashboard, PharmacyDashboard } from "./pages/dashboards/OtherDashboards";
import Settings from "./pages/Settings";
import { Toaster } from "sonner";
import EmergencyTriage from "./pages/EmergencyTriage";
import Billing from "./pages/Billing";
import Analytics from "./pages/Analytics";
import NotificationsHub from "./pages/NotificationsHub";
import AILiveCallPage from "./pages/dashboards/AILiveCallPage";

import { useSettingsStore } from "./store/useSettingsStore";

// Enterprise AI Dashboards
import HospitalBrainDashboard from './pages/dashboards/admin/HospitalBrainDashboard';
import WorkflowDashboard from './pages/dashboards/admin/WorkflowDashboard';
import BriefingDashboard from './pages/dashboards/admin/BriefingDashboard';
import Inventory from './pages/Inventory';

const queryClient = new QueryClient();

function AppRoutes() {
  const { isAuthenticated, user } = useAuthStore();
  const { theme, fontSize } = useSettingsStore();

  // Watch for new notifications to trigger Desktop/Mobile push
  const notifications = useHospitalStore((state: any) => state.notifications);
  const [seenNotificationIds, setSeenNotificationIds] = useState<Set<string>>(new Set());
  const isInitialLoad = React.useRef(true);

  useEffect(() => {
    if (user && notifications.length > 0) {
      const currentPatientId = useHospitalStore.getState().patients.find((p: any) => p.email === user.email)?.id;
      
      setSeenNotificationIds(prevSeen => {
        const newSeen = new Set(prevSeen);
        let hasNew = false;
        
        const newNotifs = notifications.filter((n: HospitalNotification) => (n.userId === user.id || n.userId === currentPatientId) && !n.isRead && !prevSeen.has(n.id));
        
        if (!isInitialLoad.current && newNotifs.length > 0) {
          // Only trigger if not initial load (prevents spam of old unread notifications)
          newNotifs.forEach((notif: HospitalNotification) => {
            if ('Notification' in window) {
              if (Notification.permission === 'granted') {
                new Notification(notif.title, { body: notif.message, icon: '/favicon.ico' });
              } else if (Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                  if (permission === 'granted') {
                    new Notification(notif.title, { body: notif.message, icon: '/favicon.ico' });
                  }
                });
              }
            }
          });
        }

        // Add all current unread notifications to seen
        notifications.filter((n: HospitalNotification) => (n.userId === user.id || n.userId === currentPatientId) && !n.isRead).forEach((n: HospitalNotification) => {
          if (!newSeen.has(n.id)) {
            newSeen.add(n.id);
            hasNew = true;
          }
        });
        
        return hasNew ? newSeen : prevSeen;
      });
      
      // After first pass, it is no longer the initial load
      if (isInitialLoad.current) {
        setTimeout(() => { isInitialLoad.current = false; }, 1000);
      }
    }
  }, [notifications, user]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    if (fontSize === 'small') {
      document.documentElement.style.fontSize = '14px';
    } else if (fontSize === 'large') {
      document.documentElement.style.fontSize = '18px';
    } else {
      document.documentElement.style.fontSize = '16px';
    }
  }, [theme, fontSize]);

  // Load data from Supabase on mount and listen for real-time changes
  useEffect(() => {
    import('./store/useHospitalStore').then(({ useHospitalStore }) => {
      useHospitalStore.getState().initializeData();
      
      // Real-time sync across different windows/devices
      import('./lib/supabase').then(({ supabase }) => {
        supabase.channel('public:appointments')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
            useHospitalStore.getState().initializeData(); // Refresh data when appointments change
          })
          .subscribe();
      });
      
      // Fallback Polling: Since Supabase Realtime might not be enabled for all tables in user's DB,
      // refresh every 5 seconds to ensure data stays perfectly in sync across users.
      const intervalId = setInterval(() => {
        useHospitalStore.getState().initializeData();
      }, 5000);
      
      return () => clearInterval(intervalId);
    });
    
    import('./store/useAuthStore').then(({ useAuthStore }) => {
      useAuthStore.getState().initializeUsers();
    });
    
    import('./store/useEnterpriseStore').then(({ useEnterpriseStore }) => {
      useEnterpriseStore.getState().initializeEnterpriseData();
    });
  }, []);

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated && user ? (
          <Navigate to={`/${user.role}`} replace />
        ) : (
          <LoginPage />
        )
      } />

      <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
        {/* Index redirects to user's specific role dashboard */}
        <Route index element={
          user ? <Navigate to={`/${user.role}`} replace /> : <Navigate to="/login" replace />
        } />

        {/* Admin Routes */}
        <Route path="admin" element={<RequireAuth allowedRoles={['admin']}><Dashboard /></RequireAuth>} />
        
        {/* Enterprise AI Features */}
        <Route path="admin/brain" element={<RequireAuth allowedRoles={['admin']}><HospitalBrainDashboard /></RequireAuth>} />
        <Route path="admin/workflows" element={<RequireAuth allowedRoles={['admin']}><WorkflowDashboard /></RequireAuth>} />
        <Route path="admin/briefing" element={<RequireAuth allowedRoles={['admin']}><BriefingDashboard /></RequireAuth>} />
        <Route path="patients" element={<RequireAuth allowedRoles={['admin', 'doctor', 'receptionist', 'nurse']}><Patients /></RequireAuth>} />
        <Route path="doctors" element={<RequireAuth allowedRoles={['admin', 'receptionist']}><Doctors /></RequireAuth>} />
        <Route path="appointments" element={<RequireAuth allowedRoles={['admin', 'doctor', 'receptionist', 'user']}><Appointments /></RequireAuth>} />
        <Route path="medical-records" element={<RequireAuth allowedRoles={['admin', 'doctor', 'user', 'nurse']}><MedicalRecords /></RequireAuth>} />

        {/* Role Dashboards */}
        <Route path="doctor" element={<RequireAuth allowedRoles={['admin', 'doctor']}><DoctorDashboard /></RequireAuth>} />
        <Route path="user" element={<RequireAuth allowedRoles={['admin', 'user']}><PatientDashboard /></RequireAuth>} />
        <Route path="ai-consult" element={<RequireAuth allowedRoles={['admin', 'user']}><AILiveCallPage /></RequireAuth>} />
        <Route path="receptionist" element={<RequireAuth allowedRoles={['admin', 'receptionist']}><ReceptionDashboard /></RequireAuth>} />
        <Route path="nurse" element={<RequireAuth allowedRoles={['admin', 'nurse']}><NurseDashboard /></RequireAuth>} />
        <Route path="laboratory" element={<RequireAuth allowedRoles={['admin', 'laboratory', 'doctor', 'nurse']}><LabDashboard /></RequireAuth>} />
        <Route path="pharmacy" element={<RequireAuth allowedRoles={['admin', 'pharmacy', 'doctor', 'nurse']}><PharmacyDashboard /></RequireAuth>} />

        {/* Additional routes */}
        <Route path="settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="onboarding" element={<RequireAuth allowedRoles={['user']}><OnboardingFlow /></RequireAuth>} />
        <Route path="emergency" element={<RequireAuth allowedRoles={['admin', 'doctor', 'receptionist', 'nurse']}><EmergencyTriage /></RequireAuth>} />
        <Route path="billing" element={<RequireAuth allowedRoles={['admin', 'receptionist', 'user']}><Billing /></RequireAuth>} />
        <Route path="inventory" element={<RequireAuth allowedRoles={['admin', 'pharmacy', 'nurse']}><Inventory /></RequireAuth>} />
        <Route path="analytics" element={<RequireAuth allowedRoles={['admin']}><Analytics /></RequireAuth>} />
        <Route path="notifications" element={<RequireAuth><NotificationsHub /></RequireAuth>} />
        
        {/* Catch-all for truly missing pages */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="bottom-right" richColors />
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="max-w-7xl mx-auto flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-muted border border-border flex items-center justify-center mb-4 text-foreground/50">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground">This module is currently under construction.</p>
    </div>
  );
}
