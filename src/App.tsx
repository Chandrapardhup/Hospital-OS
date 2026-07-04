import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./store/useAuthStore";
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
import EmergencyTriage from "./pages/EmergencyTriage";
import Billing from "./pages/Billing";
import Analytics from "./pages/Analytics";
import NotificationsHub from "./pages/NotificationsHub";

import { useSettingsStore } from "./store/useSettingsStore";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isAuthenticated, user } = useAuthStore();
  const { theme, fontSize } = useSettingsStore();

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

  // Sync state across multiple tabs live
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'hospitalos-data-v2') {
        import('./store/useHospitalStore').then(({ useHospitalStore }) => {
          useHospitalStore.persist.rehydrate();
        });
      }
      if (e.key === 'auth-storage-v2') {
        import('./store/useAuthStore').then(({ useAuthStore }) => {
          useAuthStore.persist.rehydrate();
        });
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
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
        <Route path="patients" element={<RequireAuth allowedRoles={['admin', 'doctor', 'receptionist', 'nurse']}><Patients /></RequireAuth>} />
        <Route path="doctors" element={<RequireAuth allowedRoles={['admin', 'receptionist']}><Doctors /></RequireAuth>} />
        <Route path="appointments" element={<RequireAuth allowedRoles={['admin', 'doctor', 'receptionist', 'user']}><Appointments /></RequireAuth>} />
        <Route path="medical-records" element={<RequireAuth allowedRoles={['admin', 'doctor', 'user', 'nurse']}><MedicalRecords /></RequireAuth>} />

        {/* Role Dashboards */}
        <Route path="doctor" element={<RequireAuth allowedRoles={['admin', 'doctor']}><DoctorDashboard /></RequireAuth>} />
        <Route path="user" element={<RequireAuth allowedRoles={['admin', 'user']}><PatientDashboard /></RequireAuth>} />
        <Route path="receptionist" element={<RequireAuth allowedRoles={['admin', 'receptionist']}><ReceptionDashboard /></RequireAuth>} />
        <Route path="nurse" element={<RequireAuth allowedRoles={['admin', 'nurse']}><NurseDashboard /></RequireAuth>} />
        <Route path="laboratory" element={<RequireAuth allowedRoles={['admin', 'laboratory']}><LabDashboard /></RequireAuth>} />
        <Route path="pharmacy" element={<RequireAuth allowedRoles={['admin', 'pharmacy']}><PharmacyDashboard /></RequireAuth>} />

        {/* Additional routes */}
        <Route path="settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="onboarding" element={<RequireAuth allowedRoles={['user']}><OnboardingFlow /></RequireAuth>} />
        <Route path="emergency" element={<RequireAuth allowedRoles={['admin', 'receptionist', 'nurse']}><EmergencyTriage /></RequireAuth>} />
        <Route path="billing" element={<RequireAuth allowedRoles={['admin']}><Billing /></RequireAuth>} />
        <Route path="inventory" element={<Placeholder title="Inventory" />} />
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
