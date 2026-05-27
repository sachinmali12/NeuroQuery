import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../api';
import type { User } from '../api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isAuthenticated = !!token;

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('novasql_token');
      if (storedToken) {
        try {
          // Token is present in localStorage, Axios interceptor will automatically append it
          setToken(storedToken);
          const userData = await apiService.getCurrentUser();
          setUser(userData);
        } catch (err) {
          console.warn('Session verification failed, clearing credentials:', err);
          localStorage.removeItem('novasql_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await apiService.loginUser(email, password);
      localStorage.setItem('novasql_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.username}!`, {
        style: { background: '#111827', color: '#10b981', border: '1px solid rgba(16,185,129,0.15)' }
      });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid email or password';
      toast.error(msg, {
        style: { background: '#111827', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }
      });
      throw err;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      await apiService.registerUser(username, email, password);
      toast.success('Registration successful! Please login.', {
        style: { background: '#111827', color: '#10b981', border: '1px solid rgba(16,185,129,0.15)' }
      });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration failed';
      toast.error(msg, {
        style: { background: '#111827', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }
      });
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('novasql_token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully', {
      style: { background: '#111827', color: '#10b981', border: '1px solid rgba(16,185,129,0.15)' }
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
