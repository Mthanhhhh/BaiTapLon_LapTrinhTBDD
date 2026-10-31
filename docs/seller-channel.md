# Kênh người bán

## Người bán

1. Đăng nhập, mở **Tài khoản → Mở shop của tôi**.
2. Điền tên shop, tỉnh/thành phố và mô tả. Shop được tạo cho tài khoản đang đăng nhập.
3. Trong **Kênh người bán**, cập nhật hồ sơ, đăng sản phẩm và xem số lượng sản phẩm, đã bán, tồn kho.
4. Chọn danh mục; nhập tên/mô tả; thêm một hay nhiều phân loại. Mỗi phân loại có tên, giá, tồn và gallery ảnh tùy chọn. Dùng URL HTTPS Cloudinary; URL có thể nhập mỗi dòng một ảnh.
5. Sản phẩm xuất hiện trên trang công khai của shop. Có thể ẩn/hiện sản phẩm từ danh sách quản lý.
6. Chọn **Quản lý đơn hàng** để xem các đơn shop và cập nhật trạng thái.

## Vòng đời đơn

- Người mua tạo đơn: `WAITING_CONFIRMATION` cho COD hoặc `PENDING_PAYMENT` cho thanh toán trực tuyến.
- Shop xác nhận: `WAITING_PICKUP`.
- Shop bàn giao vận chuyển: `SHIPPING`.
- Người mua xác nhận nhận hàng: `DELIVERED`.
- Người mua yêu cầu trả hàng: `RETURNED`.
- Người mua hủy khi đơn còn chờ thanh toán/xác nhận hoặc shop từ chối đơn chờ xác nhận: `CANCELLED`; tồn kho được hoàn lại.

Shop xem trang cửa hàng từ **Xem Shop** trên trang chi tiết sản phẩm. Trang công khai có sản phẩm, lọc/sắp xếp, bộ sưu tập và đánh giá. Chủ shop có lối tắt về kênh quản lý.

## Database khi pull code

- Database mới được khởi tạo sẽ chạy `infra/mysql/init/08_shop_channel.sql` tự động.
- Nếu MySQL đang dùng volume cũ, Docker không chạy lại các file trong `init`. Chạy migration `infra/mysql/migrations/20261031_shop_collections.sql` một lần trên database `product_db` trước khi sử dụng trang shop. Migration chỉ tạo các bảng bộ sưu tập còn thiếu (`IF NOT EXISTS`), không xóa sản phẩm hay dữ liệu hiện có.
- Ảnh sản phẩm được lưu bằng URL Cloudinary trong database; thư mục `ANH/` trên máy không cần có để app hiển thị ảnh.
