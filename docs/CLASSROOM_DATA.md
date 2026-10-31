# Lịch sử cho bản trình bày đồ án

Bộ dữ liệu này là lịch sử hư cấu phục vụ bản demo riêng cho thầy cô, theo yêu cầu chủ dự án. Tên người mua, trải nghiệm trong đánh giá, giao dịch và thời gian được sinh để thực hành; không phải nguồn đánh giá hay doanh số thu thập từ hãng/Shopee. Giao diện của bản demo không gắn nhãn vào từng bản ghi.

## Dữ liệu đã tạo

- 160 tài khoản BUYER có mật khẩu BCrypt, địa chỉ và ngày tham gia trước ngày mua.
- 3.768 đơn: 3.746 đã giao, 6 hủy, 5 chờ xác nhận, 4 chờ lấy hàng, 7 đang giao.
- 3.750 bản ghi thanh toán và giao dịch thanh toán của các đơn đã thu tiền. Cổng hiện tại của project là MOCK.
- 718 đánh giá liên kết đúng người mua, order, order item và SKU; chỉ đánh giá sau ngày nhận hàng.
- Áp dụng cho 27 sản phẩm đang hoạt động tại thời điểm tạo. Có 22 mức số lượng đánh giá khác nhau, bao gồm 0, 1, 2, 3, 4, 5, 7, 10, 15, 20 và hơn 100.
- Ví dụ: iPhone 17 Pro Max có 128 đánh giá, trung bình 4,59 và 1.389 sản phẩm đã bán. Xiaomi Pad 8 có 3 đánh giá và 11 sản phẩm đã bán. Một số sản phẩm chưa có lượt mua hoặc đánh giá.

Không ghi cứng số sao/lượt bán ở frontend. `products.rating_avg`, `rating_count`, `sold_count` và số bán SKU được tổng hợp lại từ bảng reviews và order_items của đơn DELIVERED. Có shipment, lịch sử trạng thái, snapshot giá và các bút toán nhập/xuất/hoàn kho. Lượng tồn khả dụng được giữ để vẫn thực hành đặt đơn tiếp.

Tên model, thông số kỹ thuật và nguồn catalog là công việc riêng. Seed lịch sử không xác thực thông số hay đổi tên hãng cho 27 sản phẩm. Ảnh đánh giá không tự chế thành ảnh người mua; sẽ bổ sung khi chủ dự án cung cấp.

## Tệp và kiểm chứng

- `scripts/ClassroomPassword.java`: tạo mật khẩu/hash, chỉ lưu dưới `.tools/` bị Git ignore.
- `scripts/seed-classroom-history.mjs --classroom-local`: tạo một lần trong container MySQL local. Từ chối chạy lại khi tài khoản của dataset đã tồn tại.
- `scripts/verify-classroom-history.mjs`: kiểm tra liên kết review–buyer–order–item, trạng thái giao, trình tự ngày giờ, tổng tiền, thanh toán, số liệu tổng hợp và tồn không âm; thử đăng nhập và đọc lịch sử đơn bằng API.
- `.tools/classroom-credentials.json`: mật khẩu chung của nhóm tài khoản để người trình bày có thể đăng nhập thử. Email từ `buyer.001@classroom.example.invalid` đến `buyer.160@classroom.example.invalid`.
- `.tools/classroom-seed-state.json` và `.tools/classroom-verification.json`: manifest và kết quả kiểm chứng, không commit tài khoản/mật khẩu lên Git.
- `.tools/before-classroom-history-20261031.sql`: bản sao lưu bốn schema trước khi tạo dữ liệu. Không tự động restore vì sẽ ghi đè thay đổi phát sinh sau đó.

Đã kiểm chứng tất cả kiểm tra quan hệ/ngày/tiền/tổng hợp đạt; đăng nhập và lịch sử đơn đạt. Màn “Xem tất cả đánh giá” có phân trang, lọc sao và số lượng tương ứng từ database. Sửa API viết đánh giá để lưu đúng order_item_id/SKU và tên tài khoản thay vì lấy order ID làm item ID.

Các đơn online có lịch sử PENDING_PAYMENT → WAITING_CONFIRMATION sau khi thanh toán, rồi mới xác nhận/giao/nhận. COD thu tiền ở ngày giao. Đơn hủy không góp vào lượt bán; đơn chưa giao chưa được đánh giá. Không gửi thư, không thu tiền hay đặt vận chuyển bên ngoài khi chạy seed.
