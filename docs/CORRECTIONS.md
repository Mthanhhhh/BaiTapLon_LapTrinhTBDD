# Bảng Đối Chiếu và Hiệu Chỉnh (docs/CORRECTIONS.md)

Tài liệu này ghi lại chi tiết các điểm sai sót trong báo cáo và code trước đó so với dữ liệu thực tế được kiểm chứng trực tiếp từ Backend API (`http://localhost:8080`) vào ngày 2026-10-11.

---

## 1. Bảng Đối Chiếu: "Mình đã ghi sai gì – Sự thật là gì"

| Hạng mục | Trước đây ghi / làm sai | Sự thật từ API thật (Kiểm chứng curl) | Giải pháp hiệu chỉnh |
|---|---|---|---|
| **Cấu trúc ProductListResponse** | Cho rằng có thể có `images`, `categoryId`, `discountPercent` | `content` chỉ có: `id`, `name`, `price`, `originalPrice` (optional), `thumbnailUrl` (string \| null), `rating`, `ratingCount`, `soldCount`, `stock`, `categoryName`. **KHÔNG CÓ** `images`, `categoryId`, `discountPercent`. | Cập nhật chính xác TypeScript type `ProductListResponse`. Không truy cập `categoryId` hay `images` từ item danh sách. |
| **Cấu trúc ProductResponse (Chi tiết)** | Nghĩ rằng có trường đánh giá phân bố, hoặc có trường policy / shop | Trả về: `id`, `name`, `description`, `price`, `originalPrice`, `categoryId`, `categoryName`, `thumbnailUrl`, `images` (mảng chuỗi), `stock`, `rating`, `ratingCount`, `soldCount`, `variants`, `createdAt`, `active`. **KHÔNG CÓ** policy, shop, rating distribution. | Cập nhật TypeScript type `ProductResponse`. Gỡ bỏ mọi mock / nhãn tĩnh về shop và policy. |
| **Cấu trúc CategoryResponse** | Ghi rằng có `thumbnailUrl`, `description`, `parentId` | API trả về: `id`, `name`, `slug`, `displayOrder`. **KHÔNG CÓ** `thumbnailUrl` hay `description`. | Render icon Ionicons dựa vào `slug` (`electronics`, `fashion`, `beauty`, `fresh-fruits`), không dùng `thumbnailUrl`. |
| **Sort Parameters** | Frontend gửi `sort=price,asc` / `price,desc` | JPA Entity chỉ có `minPrice`, không có `price`. Gửi `sort=price` hay `sort=rating` dẫn đến `PropertyReferenceException` và **lỗi 500**. | Định nghĩa bảng hằng `SORT_OPTIONS`: `minPrice,asc`, `minPrice,desc`, `soldCount,desc`, `viewCount,desc`, `ratingAvg,desc`, `discountPercent,desc`. |
| **Đường dẫn ảnh (`/images/...`)** | Ghép trực tiếp với API URL hoặc load trực tiếp đường dẫn tương đối | Server trả `/images/products/...` trỏ tới file không tồn tại trên backend (404/không có static handler). | Tạo `resolveImageUrl()`: chỉ nhận url bắt đầu bằng `http`, còn lại là null. Tạo `RemoteImage` tự động chuyển sang placeholder pastel + icon. |
| **Phần trăm giảm giá (`discountPercent`)** | Nghĩ là API trả sẵn trường `discountPercent` trong sản phẩm | API **KHÔNG** trả trường `discountPercent` trong data. Server chỉ hỗ trợ `sort=discountPercent,desc`. | Frontend tự tính: `Math.round((1 - price / originalPrice) * 100)` khi `originalPrice > price`. |
| **Nhãn chính sách (Free Return, Buyer Protection, Best Deal)** | Gõ cứng các nhãn này vào UI trang chi tiết sản phẩm | API không có bất kỳ trường boolean hay policy nào liên quan. | Gỡ bỏ hoàn toàn các nhãn chính sách gõ cứng và thông tin shop. |
| **Trang chi tiết sản phẩm bị trống** | Nghĩ rằng dữ liệu chưa tải hoặc lỗi API | Dữ liệu API tải về bình thường (chi tiết id 10 tải được), nhưng do lỗi bố cục CSS (chiều cao carousel tính theo `Dimensions.get('window').width` trên web khiến carousel cao tới 1920px và ScrollView bị lỗi tràn) nên nội dung bị đẩy xuống dưới khung nhìn thấy. | Đặt chiều cao cố định cho carousel (tỷ lệ 1:1, tối đa 480px trên web), dùng đúng cấu trúc `ScrollView`, bổ sung Skeleton và ErrorState. |

