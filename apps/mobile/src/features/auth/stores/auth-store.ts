import { create } from 'zustand';

interface AuthUser {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (user: AuthUser) => void;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setSession: (user: AuthUser): void => set({ user, isAuthenticated: true }),
  setUser: (user: AuthUser): void => set({ user, isAuthenticated: true }),
  clearSession: (): void => set({ user: null, isAuthenticated: false }),
}));
