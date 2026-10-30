import { searchHistory } from '../utils/searchHistory';
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
  socialLogin: (data: { provider: string; email: string; fullName?: string; avatarUrl?: string }) => Promise<void>;
  forgotPassword: (identifier: string) => Promise<any>;
  resetPassword: (data: { identifier: string; otp: string; newPassword: string }) => Promise<any>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  socialLogin: async () => {},
  forgotPassword: async () => {},
  resetPassword: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const loadUser = async () => {
    const token = await tokenStorage.getAccessToken();
    if (!token) {
      searchHistory.setAccount();
      setUser(null);
      return null;
    }

    try {
      const response = await apiClient.get('/api/v1/auth/me');
      const currentUser = response.data.data as User;
      searchHistory.setAccount(currentUser.id);
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      await tokenStorage.clearTokens();
      searchHistory.setAccount();
      setUser(null);
      throw error;
    }
  };

  useEffect(() => {
    loadUser()
      .catch((error) => console.warn('Could not restore the saved session', error))
      .finally(() => setLoading(false));

    const handleLogoutEvent = () => {
      searchHistory.setAccount();
      setUser(null);
      queryClient.clear();
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
    if (data.rememberMe !== undefined) {
      await tokenStorage.setRememberMe(data.rememberMe);
    }
    await tokenStorage.setTokens(accessToken, refreshToken);
    try {
      queryClient.clear();
      await loadUser();
    } catch (error) {
      await tokenStorage.clearTokens();
      throw error;
    }
  };

  const socialLogin = async (data: { provider: string; email?: string; fullName?: string; avatarUrl?: string; token?: string }) => {
    const response = await apiClient.post('/api/v1/auth/social-login', data);
    const { accessToken, refreshToken } = response.data.data;
    await tokenStorage.setRememberMe(true);
    await tokenStorage.setTokens(accessToken, refreshToken);
    queryClient.clear();
      await loadUser();
  };

  const forgotPassword = async (identifier: string) => {
    const response = await apiClient.post('/api/v1/auth/forgot-password', { identifier });
    return response.data.data;
  };

  const resetPassword = async (data: { identifier: string; otp: string; newPassword: string }) => {
    const response = await apiClient.post('/api/v1/auth/reset-password', data);
    return response.data;
  };

  const register = async (data: any) => {
    const response = await apiClient.post('/api/v1/auth/register', data);
    const { accessToken, refreshToken } = response.data.data;
    await tokenStorage.setTokens(accessToken, refreshToken);
    try {
      queryClient.clear();
      await loadUser();
    } catch (error) {
      await tokenStorage.clearTokens();
      throw error;
    }
  };

  const logout = async () => {
    await tokenStorage.clearTokens();
    searchHistory.setAccount();
      setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, socialLogin, forgotPassword, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
