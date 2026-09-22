import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

const USERS_KEY = 'calmflex-users';
const SESSION_KEY = 'calmflex-session';

export interface AuthUser {
  name: string;
  email: string;
}

interface StoredUser extends AuthUser {
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => void;
  signup: (name: string, email: string, password: string) => void;
  logout: () => void;
}

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || '') as T;
  } catch {
    return fallback;
  }
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readJson<AuthUser | null>(SESSION_KEY, null));

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: (email, password) => {
        const users = readJson<StoredUser[]>(USERS_KEY, []);
        const match = users.find(
          (entry) => entry.email.toLowerCase() === email.trim().toLowerCase() && entry.password === password
        );
        if (!match) throw new Error('Email or password is not quite right.');
        const session = { name: match.name, email: match.email };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        setUser(session);
      },
      signup: (name, email, password) => {
        const users = readJson<StoredUser[]>(USERS_KEY, []);
        if (users.some((entry) => entry.email.toLowerCase() === email.trim().toLowerCase())) {
          throw new Error('An account with that email already exists. Try logging in.');
        }
        const next: StoredUser = { name: name.trim(), email: email.trim().toLowerCase(), password };
        localStorage.setItem(USERS_KEY, JSON.stringify([...users, next]));
        const session = { name: next.name, email: next.email };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        setUser(session);
      },
      logout: () => {
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
      }
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside AuthProvider');
  return auth;
}
