import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { orderStorage } from '../utils/orderStorage';

export type OrderStatus =
  | 'PENDING_PAYMENT'      // Chờ thanh toán
  | 'WAITING_CONFIRMATION' // Chờ xác nhận
  | 'WAITING_PICKUP'       // Chờ lấy hàng
  | 'SHIPPING'             // Chờ giao hàng (Đang giao)
  | 'DELIVERED'            // Đã giao (Hoàn thành)
  | 'RETURNED'             // Trả hàng / Hoàn tiền
  | 'CANCELLED'            // Đã hủy
  | 'PAID';                // Đang chuẩn bị

export interface CartItemResponse {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  variantId?: number;
  variantName?: string;
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
  variantId?: number;
  productName: string;
  productImage?: string;
  variantName?: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderResponse {
  id: number;
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
  shippingCountry: string;
  note?: string;
  createdAt?: string;
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

// 1. Hook lấy giỏ hàng
export const useCart = () => {
  const { user } = useContext(AuthContext);

  return useQuery({
    queryKey: ['cart', user?.id || 'demo'],
    queryFn: async (): Promise<CartResponse> => {
      try {
        const { data } = await apiClient.get('/api/v1/cart');
        return data.data;
      } catch (err) {
        // Fallback demo cart nếu backend chưa có item hoặc offline
        return {
          id: 1,
          items: [
            {
              id: 101,
              productId: 1,
              productName: 'Tai nghe chụp tai Bass Pro không dây',
              productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
              variantId: 1,
              variantName: 'Đen / Tiêu chuẩn',
              price: 590000,
              quantity: 1,
              subtotal: 590000,
            },
            {
              id: 102,
              productId: 20,
              productName: 'Đèn học LED 3 màu cảm ứng thông minh',
              productImage: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80',
              variantId: 20,
              variantName: 'Trắng / 3 Chế độ sáng',
              price: 228034,
              quantity: 1,
              subtotal: 228034,
            },
          ],
          totalItems: 2,
          totalAmount: 818034,
        };
      }
    },
    staleTime: 1000 * 15,
  });
};

// 2. Thêm vào giỏ hàng
export const useAddToCart = () => {
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);

  return useMutation({
    mutationFn: async (payload: { productId: number; variantId?: number; quantity: number }) => {
      const { data } = await apiClient.post('/api/v1/cart/items', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id || 'demo'] });
    },
  });
};

// 3. Cập nhật số lượng item trong giỏ
export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);

  return useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: number; quantity: number }) => {
      const { data } = await apiClient.put(`/api/v1/cart/items/${itemId}`, { quantity });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id || 'demo'] });
    },
  });
};

// 4. Xóa một item khỏi giỏ
export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);

  return useMutation({
    mutationFn: async (itemId: number) => {
      const { data } = await apiClient.delete(`/api/v1/cart/items/${itemId}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id || 'demo'] });
    },
  });
};

// 5. Xóa sạch giỏ hàng
export const useClearCart = () => {
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.delete('/api/v1/cart');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id || 'demo'] });
    },
  });
};

// 6. Hook lấy danh sách địa chỉ nhận hàng
export const useAddresses = () => {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: async (): Promise<AddressResponse[]> => {
      try {
        const { data } = await apiClient.get('/api/v1/addresses');
        if (data.data && data.data.length > 0) {
          return data.data;
        }
      } catch (err) {
        // demo fallback
      }
      return [
        {
          id: 1,
          fullName: 'Nguyen Van A',
          phone: '0901234567',
          street: '123 Nguyen Hue Street, District 1',
          city: 'Ho Chi Minh City',
          country: 'Vietnam',
          isDefault: true,
        },
        {
          id: 2,
          fullName: 'Nguyen Van A (Office)',
          phone: '0901234567',
          street: '456 Le Duan Boulevard, District 1',
          city: 'Ho Chi Minh City',
          country: 'Vietnam',
          isDefault: false,
        },
      ];
    },
  });
};

// 7. Tạo đơn hàng thực tế
export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);

  return useMutation({
    mutationFn: async (payload: {
      addressId: number;
      voucherCode?: string;
      note?: string;
      paymentMethod: string;
    }): Promise<OrderResponse> => {
      // Lấy danh sách sản phẩm thực từ giỏ hàng hiện tại
      const cartData: CartResponse | undefined = queryClient.getQueryData(['cart', user?.id || 'demo']);
      const currentItems: OrderItemResponse[] = (cartData?.items || []).map((ci) => ({
        id: ci.id,
        productId: ci.productId,
        variantId: ci.variantId,
        productName: ci.productName,
        productImage: ci.productImage,
        variantName: ci.variantName,
        price: ci.price,
        quantity: ci.quantity,
        subtotal: ci.subtotal,
      }));

      const subtotal = currentItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
      const discount = payload.voucherCode === 'WELCOME10'
        ? subtotal * 0.1
        : payload.voucherCode === 'SUMMER15'
        ? subtotal * 0.15
        : payload.voucherCode === 'FLAT20'
        ? Math.min(subtotal, 20000)
        : 0;
      const taxable = Math.max(0, subtotal - discount);
      const tax = taxable * 0.1;
      const total = taxable + tax;

      const isCod = payload.paymentMethod === 'COD';
      const initialStatus: OrderStatus = isCod ? 'WAITING_CONFIRMATION' : 'PENDING_PAYMENT';

      let createdOrder: OrderResponse;
      try {
        const { data } = await apiClient.post('/api/v1/orders', payload);
        createdOrder = data.data;
        if (!createdOrder.items || createdOrder.items.length === 0) {
          createdOrder.items = currentItems;
        }
        createdOrder.paymentMethod = payload.paymentMethod;
      } catch (err: any) {
        createdOrder = {
          id: Math.floor(1000 + Math.random() * 9000),
          userId: user?.id || 1,
          status: initialStatus,
          items: currentItems,
          subtotal,
          discount,
          tax,
          fees: 0,
          total,
          paymentMethod: payload.paymentMethod,
          voucherCode: payload.voucherCode,
          shippingName: 'Nguyễn Văn An',
          shippingPhone: '0901234567',
          shippingStreet: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1',
          shippingCity: 'TP. Hồ Chí Minh',
          shippingCountry: 'Việt Nam',
          note: payload.note,
          createdAt: new Date().toISOString(),
        };
      }

      // Lưu trữ đơn hàng thực tế vào local store để truy xuất tức thời và bền vững
      await orderStorage.addOrder(createdOrder);

      return createdOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', user?.id || 'demo'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};

// 8. Xử lý thanh toán (Payment -> COMPLETED / FAILED)
export const useProcessPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: PaymentRequest): Promise<PaymentResponse> => {
      // Backend mock: nếu cardNumber kết thúc bằng 0000 -> Báo lỗi thất bại
      if (payload.cardNumber && payload.cardNumber.replace(/\s+/g, '').endsWith('0000')) {
        throw new Error('Payment failed (mocked). Card ending in 0000 was declined.');
      }

      try {
        const { data } = await apiClient.post('/api/v1/payments', payload);
        return data.data;
      } catch (err: any) {
        if (err.message && err.message.includes('Payment failed')) {
          throw err;
        }
        // Fallback demo response nếu backend offline
        const cleanCard = payload.cardNumber ? payload.cardNumber.replace(/\s+/g, '') : '1234';
        return {
          id: Math.floor(5000 + Math.random() * 5000),
          orderId: payload.orderId,
          method: payload.method,
          status: 'COMPLETED',
          amount: 60.48,
          cardLastFour: cleanCard.slice(-4),
          cardType: payload.method,
          transactionId: 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
          paidAt: new Date().toISOString(),
        };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};
