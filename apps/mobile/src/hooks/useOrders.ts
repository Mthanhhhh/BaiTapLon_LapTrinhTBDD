import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { OrderResponse, OrderStatus } from './useCart';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';


export interface PageResponse<T> {
  content: T[];
  pageNo: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ReviewRequest {
  orderId: number;
  rating: number; // 1 to 5
  comment?: string;
  emotion?: 'GOOD' | 'NEUTRAL' | 'BAD';
  tags?: string[];
  imageUrls?: string[];
}

export interface ReviewResponse {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment?: string;
  emotion?: string;
  tags?: string[];
  imageUrls?: string[];
  createdAt: string;
}

// Hook lấy danh sách đơn hàng thực tế
export const useOrders = (page: number = 0, size: number = 20, shop: boolean = false, enabled: boolean = true) => {
  const { user } = useContext(AuthContext);

  return useQuery({
    queryKey: ['orders', user?.id, shop, page, size],
    enabled: !!user && enabled,
    queryFn: async (): Promise<PageResponse<OrderResponse>> => {
      const res = await apiClient.get<any>(shop ? '/api/v1/orders/shop/orders' : '/api/v1/orders', {
        params: { page, size, sort: 'createdAt,desc' },
      });
      return res.data.data as PageResponse<OrderResponse>;
    },
  });
};

// Hook Shop xác nhận đơn hàng (Chờ xác nhận -> Chờ lấy hàng)
export const useConfirmOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: number): Promise<OrderResponse> => {
      const { data } = await apiClient.post(`/api/v1/orders/${orderId}/confirm`);
      return data.data as OrderResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

// Hook Shop giao cho đơn vị vận chuyển (Chờ lấy hàng -> Chờ giao hàng)
export const useShipOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: number): Promise<OrderResponse> => {
      const { data } = await apiClient.post(`/api/v1/orders/${orderId}/ship`);
      return data.data as OrderResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

// Hook Người mua nhấn "Đã nhận được hàng" (Chờ giao hàng -> Đã giao)
export const useReceiveOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: number): Promise<OrderResponse> => {
      const { data } = await apiClient.post(`/api/v1/orders/${orderId}/receive`);
      return data.data as OrderResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

// Hook Người mua yêu cầu trả hàng / hoàn tiền (Đã giao -> Trả hàng)
export const useReturnOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: number): Promise<OrderResponse> => {
      const { data } = await apiClient.post(`/api/v1/orders/${orderId}/return`);
      return data.data as OrderResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

// Hook Hủy đơn hàng (Chờ thanh toán / Chờ xác nhận -> Đã hủy)
export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: number): Promise<OrderResponse> => {
      const { data } = await apiClient.post(`/api/v1/orders/${orderId}/cancel`);
      return data.data as OrderResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

// Hook Đánh giá sản phẩm
export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      payload,
    }: {
      productId: number;
      payload: ReviewRequest;
    }): Promise<ReviewResponse> => {
      const res = await apiClient.post<any>(`/api/v1/products/${productId}/reviews`, payload);
      return res.data?.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};
