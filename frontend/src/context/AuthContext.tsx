import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiUrl } from '../config/api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

async function authRequest(path: string, body?: object) {
  const response = await fetch(apiUrl(path), {
    method: body ? 'POST' : 'GET',
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  if (response.status === 204) return null;
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Account request failed. Please try again.');
  return result;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.removeItem('calmflex-users');
    localStorage.removeItem('calmflex-session');
    authRequest('/api/auth/me')
      .then((result) => setUser(result.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        if (!password || password.length > 256) throw new Error('Email or password is not quite right.');
        const result = await authRequest('/api/auth/login', { email, password });
        setUser(result.user);
      },
      signup: async (name, email, password) => {
        const result = await authRequest('/api/auth/signup', { name, email, password });
        setUser(result.user);
      },
      logout: async () => {
        await authRequest('/api/auth/logout', {});
        setUser(null);
      }
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside AuthProvider');
  return auth;
}
