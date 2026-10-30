import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AddressResponse } from './useCart';

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  roles?: string[];
  createdAt?: string;
}

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface AddressPayload {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  isDefault: boolean;
}

// Fetch Profile
export const useUserProfile = () => {
  const { user } = useContext(AuthContext);
  return useQuery({ queryKey: ['profile', user?.id], enabled: !!user,
    queryFn: async (): Promise<UserProfile> => (await apiClient.get('/api/v1/auth/me')).data.data });
};

// Update Profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
      const res = await apiClient.put<any>('/api/v1/auth/me', payload);
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

// Fetch User Addresses
export const useUserAddresses = () => {
  const { user } = useContext(AuthContext);
  return useQuery({ queryKey: ['addresses', user?.id], enabled: !!user,
    queryFn: async (): Promise<AddressResponse[]> => (await apiClient.get('/api/v1/addresses')).data.data });
};

// Add Address
export const useAddAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddressPayload): Promise<AddressResponse> => {
      const res = await apiClient.post<any>('/api/v1/addresses', payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

// Delete Address
export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await apiClient.delete(`/api/v1/addresses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

// Set Default Address
export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<AddressResponse> => {
      const res = await apiClient.patch<any>(`/api/v1/addresses/${id}/default`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
  });
};

