import type { User } from '../types/auth';
import { useAuthStore } from '../store/useAuthStore';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const authService = {
  login: async (email: string, password: string):Promise<{user: Omit<User, 'password'>, token: string}> => {
    // Simulate network delay
    await delay(1200);

    const users = useAuthStore.getState().users;
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Don't leak password to the frontend state
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token: `mock-jwt-token-${user.id}-${Date.now()}` // Simulate a JWT token
    };
  },

  verifyOtp: async (otp: string): Promise<boolean> => {
    await delay(1000);
    return otp === '123456'; // Mock OTP validation
  },

  resetPassword: async (email: string): Promise<boolean> => {
    await delay(1500);
    const users = useAuthStore.getState().users;
    const exists = users.some(u => u.email === email);
    if (!exists) throw new Error('Email not found in our system');
    return true;
  }
};
