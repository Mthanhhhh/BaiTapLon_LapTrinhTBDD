/**
 * Định dạng tiền tệ Việt Nam (VNĐ)
 * Dữ liệu đồng bộ 100% mệnh giá VNĐ thực tế
 */
export const formatVND = (value?: number | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '0₫';
  return `${Math.round(value).toLocaleString('vi-VN')}₫`;
};

/**
 * Định dạng lượt bán bằng tiếng Việt chuẩn Shopee (vd: "Đã bán 1,5k", "Đã bán 10k")
 */
export const formatSoldVi = (count?: number | null): string => {
  if (!count || count <= 0) return 'Đã bán 0';
  if (count >= 10000) {
    const k = Math.floor(count / 1000);
    return `Đã bán ${k}k`;
  }
  if (count >= 1000) {
    const k = (count / 1000).toFixed(1).replace('.0', '').replace('.', ',');
    return `Đã bán ${k}k`;
  }
  return `Đã bán ${count}`;
};

/**
 * Tính toán thời gian giao hàng ước tính dựa trên vị trí Shop và khách hàng
 * (Mô phỏng đơn vị vận chuyển bên thứ 3 như GHN, Viettel Post, SPX)
 */
export const calculateShippingTime = (
  shopLocation?: string | null,
  userLocation: string = 'TP. Hồ Chí Minh'
): { timeText: string; isExpress: boolean } => {
  const shop = (shopLocation || 'TP. Hồ Chí Minh').toLowerCase();
  const user = userLocation.toLowerCase();

  // Nội thành (cùng thành phố): Nhận trong 24h hoặc ngày mai
  if (
    (shop.includes('hồ chí minh') && user.includes('hồ chí minh')) ||
    (shop.includes('hà nội') && user.includes('hà nội')) ||
    shop === user
  ) {
    return {
      timeText: 'Ngày mai 10:00',
      isExpress: true,
    };
  }

  // Tuyến liên tỉnh Hà Nội - TP.HCM (Trục Bắc - Nam): 2-3 ngày
  if (
    (shop.includes('hà nội') && user.includes('hồ chí minh')) ||
    (shop.includes('hồ chí minh') && user.includes('hà nội'))
  ) {
    return {
      timeText: 'Giao 2-3 ngày',
      isExpress: false,
    };
  }

  // Các tỉnh thành khác
  return {
    timeText: 'Giao 3-4 ngày',
    isExpress: false,
  };
};

