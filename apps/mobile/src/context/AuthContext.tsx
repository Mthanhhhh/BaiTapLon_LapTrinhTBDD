import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, AppError } from '../api/client';
import { tokenStorage } from '../utils/tokenStorage';
import { useQueryClient } from '@tanstack/react-query';

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  roles: string[];
}

interface AuthContextProps {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const loadUser = async () => {
    try {
      setLoading(true);
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await apiClient.get('/api/v1/auth/me');
      setUser(response.data.data);
    } catch (error) {
      console.log('Failed to load user', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    const handleLogoutEvent = () => {
      setUser(null);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:logout', handleLogoutEvent);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth:logout', handleLogoutEvent);
      }
    };
  }, []);

  const login = async (data: any) => {
    const response = await apiClient.post('/api/v1/auth/login', data);
    const { accessToken, refreshToken } = response.data.data;
    await tokenStorage.setTokens(accessToken, refreshToken);
    await loadUser();
  };

  const register = async (data: any) => {
    const response = await apiClient.post('/api/v1/auth/register', data);
    const { accessToken, refreshToken } = response.data.data;
    await tokenStorage.setTokens(accessToken, refreshToken);
    await loadUser();
  };

  const logout = async () => {
    await tokenStorage.clearTokens();
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
