import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useHospitalStore } from '../../store/useHospitalStore';
import type { Role } from '../../types/auth';

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const { isAuthenticated, user } = useAuthStore();
  const patients = useHospitalStore(state => state.patients);
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Onboarding Check for new users (patients)
  if (user.role === 'user' && location.pathname !== '/onboarding') {
    const patientRecord = patients.find(p => p.email === user.email);
    if (patientRecord && (!patientRecord.bloodGroup || patientRecord.bloodGroup === 'Unknown')) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role not authorized, redirect to their role's home page
    switch(user.role) {
      case 'admin': return <Navigate to="/admin" replace />;
      case 'doctor': return <Navigate to="/doctor" replace />;
      case 'user': return <Navigate to="/user" replace />;
      case 'receptionist': return <Navigate to="/reception" replace />;
      case 'nurse': return <Navigate to="/nurse" replace />;
      case 'laboratory': return <Navigate to="/laboratory" replace />;
      case 'pharmacy': return <Navigate to="/pharmacy" replace />;
      default: return <Navigate to="/login" replace />;
    }
  }

  return children;
}
