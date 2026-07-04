export type Role = 
  | 'admin'
  | 'doctor'
  | 'user'
  | 'receptionist'
  | 'nurse'
  | 'laboratory'
  | 'pharmacy';

export interface User {
  id: string;
  email: string;
  password?: string; // Stored in mock DB for login, removed from session
  name: string;
  role: Role;
  avatar?: string;
  department?: string; // For doctors, nurses, etc.
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
