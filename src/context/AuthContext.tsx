'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  points: number;
  coins: number;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (user: User, token?: string) => void;
  logout: () => void;
  updatePoints: (points: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('godashreel_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('godashreel_user');
      }
    }
    // Auto-login via token if available
    const token = localStorage.getItem('godashreel_token');
    if (token && !stored) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then((data) => {
          if (data?.user) {
            const withAdmin = { ...data.user, isAdmin: data.user.role === 'ADMIN' };
            setUser(withAdmin);
            localStorage.setItem('godashreel_user', JSON.stringify(withAdmin));
          }
        })
        .catch(() => {
          localStorage.removeItem('godashreel_token');
        });
    }
  }, []);

  const login = (userData: User, token?: string) => {
    const withAdmin = { ...userData, isAdmin: userData.role === 'ADMIN' };
    setUser(withAdmin);
    localStorage.setItem('godashreel_user', JSON.stringify(withAdmin));
    if (token) localStorage.setItem('godashreel_token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('godashreel_user');
    localStorage.removeItem('godashreel_token');
  };

  const updatePoints = (points: number) => {
    if (user) {
      const updated = { ...user, points: user.points + points };
      setUser(updated);
      localStorage.setItem('godashreel_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updatePoints }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
