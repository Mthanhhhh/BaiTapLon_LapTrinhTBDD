# Shop và thanh toán local

Chạy scripts/shop-collections.sql trên MySQL trước khi chạy product-service. Script chỉ tạo bảng mới bằng IF NOT EXISTS.

- Xem shop từ chi tiết sản phẩm hoặc đường dẫn /shop/{shopId}.
- Trang shop có tìm kiếm, bộ sưu tập tùy chỉnh, bán chạy, phổ biến, mới nhất, đánh giá và lọc giá, phân trang sản phẩm/đánh giá.
- Chủ shop vào Tài khoản → Quản lý shop → Tùy chỉnh danh mục để đặt tên, chọn sản phẩm và lưu vào MySQL. API chặn tài khoản khác bằng 403.
- Quản lý đơn shop mở chế độ người bán trong trang Đơn hàng.
- Checkout mặc định COD; COD tạo đơn chờ xác nhận, không qua form thẻ.
- Trả trước mở /payment/{orderId}; tải lại trang sẽ lấy số tiền và phương thức từ backend.
- Visa/Maestro/PayPal hiện dùng provider thử nghiệm local, không trừ tiền thật. Chỉ nhập thông tin thử nghiệm. Chưa tích hợp merchant/cổng thanh toán thật.
- Đã kiểm thử API: quyền sửa danh mục, phạm vi sản phẩm theo shop, lọc danh mục/giá, COD, Visa và PayPal thử nghiệm, chặn thanh toán lặp.
- Java COMPLETED ánh xạ vào SUCCESS trong MySQL. Phương thức đơn được lưu trong orders.payment_method_type.
