# Trang chủ và thông báo

Áp dụng scripts/home-notifications.sql trước khi chạy auth-service/order-service/product-service. Script tạo bảng app_notifications và thêm taxonomy danh mục theo slug, không tạo shop chính hãng, giá bán, tồn kho hay khuyến mãi giả.

- Home dùng 5 banner do dự án thiết kế: tự chuyển sau 1,8 giây khi màn hình hoạt động; vuốt ngang, nút trước/sau, chấm chọn và nút tạm dừng.
- Danh mục cuộn ngang lấy từ /categories/catalog, gồm danh mục đang hoạt động trong MySQL.
- Dành cho bạn dùng tìm kiếm gần nhất của từng tài khoản (khách chưa đăng nhập có scope riêng). Backend lọc tên sản phẩm khớp rồi sắp theo rating, số đánh giá, số bán và ID; phân trang tại server. Không xếp sản phẩm không khớp lên trước vì bán nhiều.
- Thông báo trạng thái đơn lưu trong MySQL cùng transaction cập nhật đơn. Event key tránh trùng. Đọc/xem chỉ theo userId từ JWT.
- Mã khuyến mãi chỉ xuất hiện khi voucher ACTIVE, đã bắt đầu, chưa hết hạn và còn lượt dùng trong backend. Không tạo thêm voucher để giả lập ưu đãi.
- Thông báo trong ứng dụng kiểm tra mỗi 2 giây khi foreground, cập nhật badge và hiện toast khi có mục mới. Chưa tích hợp OS push khi app đóng. Chuyển trang/mở lại vẫn tải được inbox và trạng thái đã đọc.
- Kiểm thử: PRACTICE_PASSWORD=... node scripts/verify-home-notifications.mjs (PowerShell đặt biến môi trường trước). Script dùng hai tài khoản local từ bước thực hành shop, tạo đơn và xác nhận để kiểm tra inbox, quyền tài khoản và đọc thông báo.

## Giới hạn dữ liệu

Người dùng chưa có catalog/API/file nguồn được xác thực. Catalog hiện tại vẫn là dữ liệu khởi tạo/thực hành của dự án. Chưa bổ sung sản phẩm hay shop brand lớn như dữ liệu thương mại thật. Ảnh sản phẩm nhiều góc phải thuộc đúng sản phẩm từ nguồn được phép dùng; không dùng ảnh ngẫu nhiên để lấp danh mục. Banner 11.11 chỉ là nội dung chuẩn bị mua sắm, không hứa mức giảm hay chương trình chưa tồn tại.
