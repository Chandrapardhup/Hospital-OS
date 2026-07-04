import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/auth';
import { mockUsers } from '../mockDB/users';

interface AuthState {
  user: Omit<User, 'password'> | null;
  token: string | null;
  isAuthenticated: boolean;
  users: User[]; // Acts as our local database for authentication
  setAuth: (user: Omit<User, 'password'>, token: string) => void;
  logout: () => void;
  registerUser: (newUser: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      users: mockUsers, // Seed with mock users initially
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      registerUser: (newUser) => set((state) => ({ users: [...state.users, newUser] })),
    }),
    {
      name: 'auth-storage-v2',
    }
  )
);
