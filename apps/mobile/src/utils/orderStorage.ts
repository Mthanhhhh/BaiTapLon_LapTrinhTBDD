import AsyncStorage from '@react-native-async-storage/async-storage';
import { OrderResponse, OrderStatus } from '../hooks/useCart';

const ORDERS_STORAGE_KEY = '@eshop_real_orders_v2';
const AUTO_CONFIRM_KEY = '@eshop_shop_auto_confirm_v2';

// 2 đơn hàng mẫu thực tế tiếng Việt ban đầu
const INITIAL_REAL_ORDERS: OrderResponse[] = [
  {
    id: 1001,
    userId: 1,
    status: 'WAITING_CONFIRMATION',
    subtotal: 590000,
    discount: 59000,
    tax: 53100,
    fees: 0,
    total: 584100,
    paymentMethod: 'COD',
    voucherCode: 'WELCOME10',
    shippingName: 'Nguyễn Văn An',
    shippingPhone: '0908123456',
    shippingStreet: '123 Nguyễn Huệ, P. Bến Nghé, Quận 1',
    shippingCity: 'TP. Hồ Chí Minh',
    shippingCountry: 'Việt Nam',
    note: 'Giao giờ hành chính, gọi trước khi đến',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    items: [
      {
        id: 1,
        productId: 1,
        productName: 'Tai nghe chụp tai Bass Pro không dây',
        productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
        variantName: 'Đen / Tiêu chuẩn',
        price: 590000,
        quantity: 1,
        subtotal: 590000,
      },
    ],
  },
  {
    id: 1002,
    userId: 1,
    status: 'SHIPPING',
    subtotal: 228034,
    discount: 0,
    tax: 22803,
    fees: 0,
    total: 250837,
    paymentMethod: 'COD',
    shippingName: 'Trần Thị Mai',
    shippingPhone: '0912345678',
    shippingStreet: '456 Lê Duẩn, P. Bến Nghé, Quận 1',
    shippingCity: 'TP. Hồ Chí Minh',
    shippingCountry: 'Việt Nam',
    note: 'Hàng dễ vỡ xin nhẹ tay',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    items: [
      {
        id: 2,
        productId: 20,
        productName: 'Đèn học LED 3 màu cảm ứng thông minh',
        productImage: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80',
        variantName: 'Trắng / 3 Chế độ sáng',
        price: 228034,
        quantity: 1,
        subtotal: 228034,
      },
    ],
  },
];

let memoryOrders: OrderResponse[] | null = null;
let memoryAutoConfirm: boolean | null = null;

export const orderStorage = {
  async getOrders(): Promise<OrderResponse[]> {
    if (memoryOrders) return memoryOrders;
    try {
      const stored = await AsyncStorage.getItem(ORDERS_STORAGE_KEY);
      if (stored) {
        memoryOrders = JSON.parse(stored);
        return memoryOrders!;
      }
    } catch (e) {
      // ignore
    }
    memoryOrders = [...INITIAL_REAL_ORDERS];
    await this._save(memoryOrders);
    return memoryOrders;
  },

  async addOrder(order: OrderResponse): Promise<void> {
    const list = await this.getOrders();
    const autoConfirm = await this.getAutoConfirm();

    // Nếu shop đã bật tự động xác nhận đơn, đơn Chờ xác nhận sẽ tự động chuyển sang Chờ lấy hàng
    let finalOrder = { ...order };
    if (autoConfirm && finalOrder.status === 'WAITING_CONFIRMATION') {
      finalOrder.status = 'WAITING_PICKUP';
    }

    const next = [finalOrder, ...list.filter((o) => o.id !== order.id)];
    memoryOrders = next;
    await this._save(next);
  },

  async updateOrderStatus(orderId: number, status: OrderStatus): Promise<OrderResponse | null> {
    const list = await this.getOrders();
    let updated: OrderResponse | null = null;
    const next = list.map((o) => {
      if (o.id === orderId) {
        updated = { ...o, status };
        return updated;
      }
      return o;
    });
    memoryOrders = next;
    await this._save(next);
    return updated;
  },

  async getAutoConfirm(): Promise<boolean> {
    if (memoryAutoConfirm !== null) return memoryAutoConfirm;
    try {
      const stored = await AsyncStorage.getItem(AUTO_CONFIRM_KEY);
      if (stored !== null) {
        memoryAutoConfirm = stored === 'true';
        return memoryAutoConfirm;
      }
    } catch (e) {
      // ignore
    }
    memoryAutoConfirm = false;
    return false;
  },

  async setAutoConfirm(enabled: boolean): Promise<void> {
    memoryAutoConfirm = enabled;
    try {
      await AsyncStorage.setItem(AUTO_CONFIRM_KEY, enabled ? 'true' : 'false');
    } catch (e) {
      // ignore
    }

    // Nếu vừa bật tự động xác nhận, tự động duyệt tất cả các đơn đang Chờ xác nhận
    if (enabled) {
      const list = await this.getOrders();
      let hasChanges = false;
      const next = list.map((o) => {
        if (o.status === 'WAITING_CONFIRMATION') {
          hasChanges = true;
          return { ...o, status: 'WAITING_PICKUP' as OrderStatus };
        }
        return o;
      });
      if (hasChanges) {
        memoryOrders = next;
        await this._save(next);
      }
    }
  },

  async _save(orders: OrderResponse[]): Promise<void> {
    try {
      await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      // ignore
    }
  },
};

