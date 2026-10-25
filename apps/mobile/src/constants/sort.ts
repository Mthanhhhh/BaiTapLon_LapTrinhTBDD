/**
 * SORT_OPTIONS:
 * Tên trường sort gửi lên backend PHẢI khớp chính xác với entity thuộc tính của Spring Boot JPA:
 * - Best Sales: soldCount,desc
 * - Popular: viewCount,desc
 * - Price tăng: minPrice,asc
 * - Price giảm: minPrice,desc
 * - Rating: ratingAvg,desc
 * - Banner Home: discountPercent,desc (với size=1)
 * - Tiêu chí phụ ổn định: id,asc
 * TUYỆT ĐỐI không gửi `price` hoặc `rating` vì backend không có trường này trên Entity và sẽ trả lỗi HTTP 500.
 */
export const SORT_OPTIONS = {
  BEST_SALES: 'soldCount,desc',
  POPULAR: 'viewCount,desc',
  PRICE_ASC: 'minPrice,asc',
  PRICE_DESC: 'minPrice,desc',
  RATING: 'ratingAvg,desc',
  BANNER_DISCOUNT: 'discountPercent,desc',
  SECONDARY_ID: 'id,asc',
} as const;

export type SortOption = typeof SORT_OPTIONS[keyof typeof SORT_OPTIONS];

/**
 * Thêm tiêu chí phụ id,asc vào mọi lựa chọn sort chính để phân trang ổn định (stable pagination)
 * Kết quả: ['soldCount,desc', 'id,asc'] -> khi axios tuần tự hoá với paramsSerializer { indexes: null },
 * sẽ tạo thành sort=soldCount,desc&sort=id,asc
 */
export function withStableSort(sort: string | string[]): string[] {
  if (Array.isArray(sort)) {
    if (sort.includes(SORT_OPTIONS.SECONDARY_ID)) return sort;
    return [...sort, SORT_OPTIONS.SECONDARY_ID];
  }
  return [sort, SORT_OPTIONS.SECONDARY_ID];
}
