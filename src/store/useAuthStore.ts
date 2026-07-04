import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/auth';
import { mockUsers } from '../mockDB/users';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: Omit<User, 'password'> | null;
  token: string | null;
  isAuthenticated: boolean;
  users: User[]; // Acts as our local cache
  initializeUsers: () => Promise<void>;
  setAuth: (user: Omit<User, 'password'>, token: string) => void;
  logout: () => void;
  registerUser: (newUser: User) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      users: [], 
      initializeUsers: async () => {
        try {
          const { data } = await supabase.from('users').select('*');
          if (data) set({ users: data });
        } catch (error) {
          console.error("Failed to load users", error);
        }
      },
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      registerUser: async (newUser) => {
        set((state) => ({ users: [...state.users, newUser] }));
        await supabase.from('users').insert(newUser);
      },
    }),
    {
      name: 'auth-storage-v2',
    }
  )
);
