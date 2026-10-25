import { useWindowDimensions } from 'react-native';

export const MAX_CONTENT_WIDTH = 480;

/**
 * Hook trả về chiều rộng khả dụng của khung nội dung app.
 * Trên web/desktop, khung giới hạn maxWidth = 480px, căn giữa màn hình.
 * Trên mobile, giá trị này đúng bằng chiều rộng màn hình thiết bị (ví dụ 390px trên iPhone).
 */
export function useContentWidth(): number {
  const { width } = useWindowDimensions();
  return Math.min(width, MAX_CONTENT_WIDTH);
}

