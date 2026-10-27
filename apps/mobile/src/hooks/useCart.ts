import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useContext } from 'react';
import { apiClient } from '../api/client';
import { AuthContext } from '../context/AuthContext';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'WAITING_CONFIRMATION'
  | 'WAITING_PICKUP'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'RETURNED'
  | 'CANCELLED'
  | 'PAID';

export interface CartItemResponse {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  variantId?: number | null;
  variantName?: string | null;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface CartResponse {
  id: number;
  items: CartItemResponse[];
  totalItems: number;
  totalAmount: number;
}

export interface AddressResponse {
  id: number;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  isDefault: boolean;
}

export interface OrderItemResponse {
  id: number;
  productId: number;
  variantId?: number | null;
  productName: string;
  productImage?: string | null;
  variantName?: string | null;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderResponse {
  id: number;
  orderNo?: string;
  userId: number;
  status: OrderStatus;
  items: OrderItemResponse[];
  subtotal: number;
  discount: number;
  tax: number;
  fees: number;
  total: number;
  paymentMethod?: string;
  voucherCode?: string;
  shippingName: string;
  shippingPhone: string;
  shippingStreet: string;
  shippingCity: string;
  shippingDistrict?: string;
  shippingCountry: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentRequest {
  orderId: number;
  method: 'VISA' | 'MAESTRO' | 'PAYPAL';
  cardNumber?: string;
  cardHolderName?: string;
  cardExpiry?: string;
  cardCvv?: string;
  paypalEmail?: string;
}

export interface PaymentResponse {
  id: number;
  orderId: number;
  method: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: number;
  cardLastFour?: string;
  cardType?: string;
  transactionId: string;
  paidAt?: string;
  createdAt?: string;
}

const cartKey = (userId?: number) => ['cart', userId] as const;
const addressKey = (userId?: number) => ['addresses', userId] as const;

export const useCart = () => {
  const { user } = useContext(AuthContext);

  return useQuery<CartResponse>({
    queryKey: cartKey(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/cart');
      return data.data as CartResponse;
    },
    staleTime: 15_000,
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);

  return useMutation({
    mutationFn: async (payload: { productId: number; variantId?: number; quantity: number }) => {
      const { data } = await apiClient.post('/api/v1/cart/items', payload);
      return data.data as CartResponse;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKey(user?.id) }),
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);

  return useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: number; quantity: number }) => {
      const { data } = await apiClient.put(`/api/v1/cart/items/${itemId}`, { quantity });
      return data.data as CartResponse;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKey(user?.id) }),
  });
};

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);

  return useMutation({
    mutationFn: async (itemId: number) => {
      const { data } = await apiClient.delete(`/api/v1/cart/items/${itemId}`);
      return data.data as CartResponse;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKey(user?.id) }),
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.delete('/api/v1/cart');
      return data.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKey(user?.id) }),
  });
};

export const useAddresses = () => {
  const { user } = useContext(AuthContext);

  return useQuery<AddressResponse[]>({
    queryKey: addressKey(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/addresses');
      return (data.data ?? []) as AddressResponse[];
    },
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);

  return useMutation({
    mutationFn: async (payload: {
      addressId: number;
      voucherCode?: string;
      note?: string;
      paymentMethod: string;
    }) => {
      const { data } = await apiClient.post('/api/v1/orders', payload);
      return data.data as OrderResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cartKey(user?.id) });
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
    },
  });
};

export const useProcessPayment = () => {
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);

  return useMutation({
    mutationFn: async (payload: PaymentRequest) => {
      const { data } = await apiClient.post('/api/v1/payments', payload);
      return data.data as PaymentResponse;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders', user?.id] }),
  });
};
