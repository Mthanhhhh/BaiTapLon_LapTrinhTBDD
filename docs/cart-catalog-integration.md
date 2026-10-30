# Đồng bộ catalog và sửa giỏ hàng

Đã hợp nhất origin/main (563d458 catalog/ảnh và 644adec checkout) với giao diện local. Xung đột tại Home/Account/ProductDetail đã giải quyết bằng cách giữ bố cục local, ghép cập nhật địa chỉ, metadata và ảnh theo phân loại từ GitHub.

## Luồng giao diện

- Tất cả icon giỏ hàng mở /cart: xem hàng, tăng/giảm, xóa, tạm tính.
- Mua hàng tại giỏ mới mở /checkout: địa chỉ, ghi chú, phương thức, xác nhận đặt đơn.
- COD đi thẳng tới kết quả đặt hàng. Trả trước mở /payment/{orderId}.
- Nút Mua ngay ở sản phẩm giữ luồng tới checkout.
- Giảm khoảng cách lưới xuống 6px và bỏ margin trùng trong ProductCard; nhóm trang chủ/shop/tài khoản/thông báo được thu gọn.

## Database hiện có

Đã sao lưu product_db, auth_db và order_db vào .tools trước khi thay đổi. Các file sao lưu nằm ngoài Git.

- scripts/refresh-real-catalog.sql là script một lần; KHÔNG chạy lại vì sẽ tạo trùng sản phẩm. Local đã áp dụng, hiện có 27 sản phẩm và 78 ảnh.
- scripts/fix-a37-green.sql cập nhật ảnh xanh theo bản GitHub.
- infra/mysql/migrations/20261030_order_status_values.sql phải chạy trên order_db.
- scripts/preserve-legacy-checkout.sql chỉ dùng cho DB cũ có các cột shim. Nó sao chép số tiền, địa chỉ và item snapshot sang các cột chuẩn. Không dùng cho DB mới không có bảng addresses/cột legacy.
- Giá trong catalog là giá khởi tạo theo scripts/build-real-catalog.py, cần kiểm tra với nhà cung cấp trước khi bán thực tế.

## Kiểm tra

TypeScript/build backend; API thêm/sửa/xóa giỏ, không sinh đơn khi thao tác giỏ, tạo COD, xóa giỏ sau đặt đơn, giữ số tiền và item đơn cũ. Toàn bộ 78 URL ảnh trả về image thành công. Script scripts/verify-cart-checkout.mjs chạy với PRACTICE_PASSWORD và ALLOW_PRACTICE_CART_RESET=1, chỉ dành cho tài khoản thực hành local.
