import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'procurement_officer' | 'manager' | 'vendor';
  vendorId?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password_hash: string) => Promise<User>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password_hash: string) => {
        set({ isLoading: true, error: null });
        try {
          const result = await api.auth.login(email, password_hash);
          set({
            user: result.user,
            token: result.token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          return result.user;
        } catch (err: any) {
          const errMsg = err?.response?.data?.message || err?.message || 'Invalid credentials';
          set({ error: errMsg, isLoading: false, isAuthenticated: false });
          throw err;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        });
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage', // key in localStorage
    }
  )
);
