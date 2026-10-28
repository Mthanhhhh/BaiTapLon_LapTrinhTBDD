import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
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
  state?: string;
  country: string;
  zipCode?: string;
  isDefault: boolean;
}

// Fallback mock addresses
const MOCK_ADDRESSES: AddressResponse[] = [
  {
    id: 1,
    fullName: 'Alex Johnson',
    phone: '+1 555-0199',
    street: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'OR',
    country: 'United States',
    zipCode: '97477',
    isDefault: true,
  },
  {
    id: 2,
    fullName: 'Alex Office',
    phone: '+1 555-0234',
    street: '100 Silicon Blvd, Suite 400',
    city: 'San Jose',
    state: 'CA',
    country: 'United States',
    zipCode: '95113',
    isDefault: false,
  },
];

// Fetch Profile
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async (): Promise<UserProfile> => {
      try {
        const res = await apiClient.get<any>('/api/v1/auth/me');
        return res.data.data;
      } catch (err) {
        return {
          id: 1,
          email: 'alex.johnson@example.com',
          fullName: 'Alex Johnson',
          phone: '+1 555-0199',
        };
      }
    },
  });
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
      queryClient.setQueryData(['profile'], data);
    },
  });
};

// Fetch User Addresses
export const useUserAddresses = () => {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: async (): Promise<AddressResponse[]> => {
      try {
        const res = await apiClient.get<any>('/api/v1/addresses');
        return res.data.data;
      } catch (err) {
        return MOCK_ADDRESSES;
      }
    },
  });
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

