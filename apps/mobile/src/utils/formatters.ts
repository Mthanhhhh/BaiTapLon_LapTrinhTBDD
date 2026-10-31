import {estimateDelivery} from './vietnamShipping';
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

/** Province-level estimate; never assumes a customer's destination. */
export const calculateShippingTime = (shopLocation?:string|null,userLocation?:string|null) => {
 const estimate=estimateDelivery(shopLocation,userLocation);
 return {timeText:estimate?`Dự kiến ${estimate.label}`:'Chọn nơi nhận',isExpress:false};
};
