import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useCart = () => {
  const { user } = useContext(AuthContext);

  return useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await apiClient.get('/api/v1/cart');
      return data.data; // CartResponse
    },
    enabled: !!user,
  });
};

import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);

  return useMutation({
    mutationFn: async (payload: { productId: number; variantId?: number; quantity: number }) => {
      const { data } = await apiClient.post('/api/v1/cart/items', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id] });
    },
  });
};
