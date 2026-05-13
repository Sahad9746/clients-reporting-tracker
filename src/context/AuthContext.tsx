import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useClients } from './ClientsContext';

export type AuthRole = 'superadmin' | 'client';

export interface AuthState {
  role: AuthRole;
  clientId?: string;
}

interface AuthContextType {
  auth: AuthState | null;
  loginAdmin: (password: string) => boolean;
  loginClient: (clientId: string, password: string) => boolean;
  logout: () => void;
}

const AUTH_KEY = 'adm-auth';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) return JSON.parse(raw) as AuthState;
  } catch { /* ignore */ }
  return null;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [auth, setAuth] = useState<AuthState | null>(loadAuth);

  const { clients } = useClients();

  const persist = (state: AuthState | null) => {
    if (state) localStorage.setItem(AUTH_KEY, JSON.stringify(state));
    else localStorage.removeItem(AUTH_KEY);
  };

  const loginAdmin = (password: string): boolean => {
    const correct = import.meta.env.VITE_ADMIN_PASSWORD || 'admin';
    if (password !== correct) return false;
    const state: AuthState = { role: 'superadmin' };
    setAuth(state);
    persist(state);
    return true;
  };

  const loginClient = (clientId: string, password: string): boolean => {
    try {
      const client = clients.find(c => c.id === clientId);
      if (!client?.password || client.password !== password) return false;
      const state: AuthState = { role: 'client', clientId };
      setAuth(state);
      persist(state);
      return true;
    } catch { return false; }
  };

  const logout = () => { setAuth(null); persist(null); };

  return (
    <AuthContext.Provider value={{ auth, loginAdmin, loginClient, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
