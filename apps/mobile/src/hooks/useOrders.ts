import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { OrderResponse, OrderStatus } from './useCart';
import { orderStorage } from '../utils/orderStorage';

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
export const useOrders = (page: number = 0, size: number = 20) => {
  return useQuery({
    queryKey: ['orders', page, size],
    queryFn: async (): Promise<PageResponse<OrderResponse>> => {
      // 1. Lấy toàn bộ đơn hàng thực đã lưu trữ
      const storedOrders = await orderStorage.getOrders();

      // 2. Cố gắng lấy thêm đơn hàng từ API backend
      let remoteOrders: OrderResponse[] = [];
      try {
        const res = await apiClient.get<any>(`/api/v1/orders?page=${page}&size=${size}&sort=createdAt,desc`);
        if (res.data?.data?.content) {
          remoteOrders = res.data.data.content;
        }
      } catch (err) {
        // Backend offline hoặc không có mạng, sử dụng storedOrders
      }

      // 3. Hợp nhất đơn hàng: ưu tiên storedOrders nếu cùng ID (vì đã cập nhật trạng thái mới nhất)
      const combinedMap = new Map<number, OrderResponse>();
      remoteOrders.forEach((o) => combinedMap.set(o.id, o));
      storedOrders.forEach((o) => combinedMap.set(o.id, o));

      const merged = Array.from(combinedMap.values()).sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      return {
        content: merged,
        pageNo: 0,
        pageSize: size,
        totalElements: merged.length,
        totalPages: 1,
        last: true,
      };
    },
  });
};

// Hook Shop xác nhận đơn hàng (Chờ xác nhận -> Chờ lấy hàng)
export const useConfirmOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: number): Promise<OrderResponse> => {
      try {
        await apiClient.post(`/api/v1/orders/${orderId}/confirm`);
      } catch (e) {
        // ignore
      }
      const updated = await orderStorage.updateOrderStatus(orderId, 'WAITING_PICKUP');
      return updated!;
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
      try {
        await apiClient.post(`/api/v1/orders/${orderId}/ship`);
      } catch (e) {
        // ignore
      }
      const updated = await orderStorage.updateOrderStatus(orderId, 'SHIPPING');
      return updated!;
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
      try {
        await apiClient.post(`/api/v1/orders/${orderId}/receive`);
      } catch (e) {
        // ignore
      }
      const updated = await orderStorage.updateOrderStatus(orderId, 'DELIVERED');
      return updated!;
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
      try {
        await apiClient.post(`/api/v1/orders/${orderId}/return`);
      } catch (e) {
        // ignore
      }
      const updated = await orderStorage.updateOrderStatus(orderId, 'RETURNED');
      return updated!;
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
      try {
        await apiClient.post(`/api/v1/orders/${orderId}/cancel`);
      } catch (e) {
        // ignore
      }
      const updated = await orderStorage.updateOrderStatus(orderId, 'CANCELLED');
      return updated!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

// Hook Shop cấu hình Tự động xác nhận đơn hàng
export const useAutoConfirmSetting = () => {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['shop_auto_confirm'],
    queryFn: () => orderStorage.getAutoConfirm(),
  });

  const mutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      await orderStorage.setAutoConfirm(enabled);
      return enabled;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop_auto_confirm'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  return {
    autoConfirm: !!query.data,
    isLoading: query.isLoading,
    setAutoConfirm: mutation.mutate,
    isUpdating: mutation.isPending,
  };
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
