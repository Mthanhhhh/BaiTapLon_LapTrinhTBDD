# Checkout, phân loại và chat

## Hành vi

- Tên sản phẩm trên thẻ, giỏ, checkout, đơn hàng và chi tiết được giới hạn một dòng.
- Add/buy dùng chung `PurchaseSelector`. Mua ngay truyền `skuId` + `quantity`; không thêm vào giỏ. Mua từ giỏ truyền danh sách `cartItemIds` đã chọn. Có checkbox từng dòng, từng shop và tất cả.
- `POST /api/v1/orders/basket/quote` chia các dòng theo shop và tính báo giá. `POST /api/v1/orders/basket` tạo các đơn trong cùng giao dịch database. Chỉ xóa dòng giỏ đã mua. Mua ngay giữ nguyên giỏ.
- Mỗi đơn có giá/hash từ server, tồn kho, reservation voucher, giới hạn ngân sách/lượt và idempotency. Giá hoặc ưu đãi thay đổi phải báo giá lại. Một lần checkout tối đa 100 dòng/10 shop. Với nhiều shop và thanh toán online, khách thanh toán từng đơn trong danh sách đơn chờ thanh toán.
- Giảm giá sản phẩm do shop cấu hình độc lập với voucher SHOP, PLATFORM và SHIPPING. Giá niêm yết đã gồm thuế; không cộng thêm VAT lần nữa. Tự chọn mã tốt nhất được tính cho từng đơn shop, đồng thời trừ hạn mức/ngân sách chung đã phân bổ cho các đơn trước trong basket.
- `POST /api/v1/promotions/prices` nhận tối đa 60 product IDs: chọn giá sản phẩm thấp nhất đủ tồn và các SKU flash đang mở, sau đó áp voucher tài khoản đủ điều kiện cho một sản phẩm. Giá trên thẻ không gồm phí vận chuyển. Chọn SKU/số lượng khác sẽ báo giá lại; server quyết định giá cuối cùng lúc đặt.
- Checkout mở trang `/addresses`; có thêm/sửa/xóa/đặt mặc định. Chọn “Giao đến đây” lưu ID trong phiên của tài khoản và quay lại checkout. Địa chỉ mặc định lưu ở backend và dùng khi chưa chọn địa chỉ riêng.
- Lỗi danh sách đơn shop do Spring thêm `createdAt` vào SQL native đã được sửa: repository giữ thứ tự `created_at`, service bỏ Sort từ Pageable trước khi gọi truy vấn native.

## Catalog trên server demo

Đã cập nhật 831 sản phẩm đang bán với các trục lựa chọn và giá SKU lưu trong database, giữ ID SKU cũ và các snapshot đơn trước đây. Điện thoại/tablet có màu–dung lượng, laptop RAM–SSD, quần áo màu–size, giày màu–cỡ; nhóm khác có lựa chọn phù hợp hoặc quy cách/đóng gói. Giá, cấu hình biến thể và tồn bổ sung là thiết lập cho bài demo theo yêu cầu, không phải dữ liệu tồn/giá/cấu hình xác minh từ hãng. Ảnh hiện có được giữ, không tạo ảnh riêng giả cho từng màu. Có 6 sản phẩm trong phiên Flash Sale Apple đang mở tại thời điểm cập nhật; phiên có hạn, quota và ngân sách thật trong database.

Không chạy lại seed để khôi phục kết nối. Dữ liệu này nằm trên database dùng chung của máy chủ, không nằm trong APK/Git. Backup trước thay đổi: `.tools/before-checkout-chat-20261101.sql` (file riêng, không commit). Báo cáo cập nhật phân loại nằm trong `.tools/rich-variants-report.json` và `.tools/refined-variant-report.json`.

## Chat

Các endpoint `/api/v1/orders/chat`: danh sách hội thoại, mở theo shop hoặc đơn, đọc/gửi tin, đánh dấu đã đọc, cấp ticket WebSocket. Chỉ người mua và chủ shop được truy cập. Tin nhắn lưu trước khi phát sự kiện, khóa gửi lại theo `clientMessageId`, giới hạn độ dài/tần suất, lịch sử phân trang bằng cursor.

`/ws/chat` qua gateway dùng ticket ngẫu nhiên dùng một lần, hạn 60 giây; không đưa JWT vào URL. Sự kiện riêng cho hai bên sau commit, kiểm tra tài khoản hoạt động. App làm mới hộp thư và thông báo khi nhận sự kiện, có polling dự phòng. Gateway phải forward cả `/ws/promotions` và `/ws/chat`. WebSocket chat hiện chạy một instance order-service; cần pub/sub nếu mở nhiều instance.

Đơn mua có nút chat shop, đơn của người bán có nút chat khách; tài khoản có hộp thư. Thông báo CHAT dẫn về hội thoại.

## Tìm kiếm

`/products/search` nhận categoryId, province, brandId, minRating, minPrice/maxPrice và sort. `/products/filter-options` trả nơi bán/thương hiệu đang có catalog. Khoảng giá lọc theo giá SKU trước voucher. Trang chủ xếp hạng toàn bộ catalog theo tối đa 5 tìm kiếm gần nhất, độ mới từ khóa, độ liên quan danh mục, điểm sao có trọng số số đánh giá, lượt bán và ID ổn định. Không dùng AI để bịa kết quả hoặc loại bỏ các sản phẩm còn lại.

## Triển khai và kiểm tra

Database hiện tại đã áp dụng `infra/mysql/init/14_checkout_chat.sql`; máy chủ/database khác cần áp dụng file này sau các migration trước, không xóa volume. Các bảng mới dùng `CREATE TABLE IF NOT EXISTS`. Build/restart product-service, order-service và api-gateway. APK cần build lại để nhận các màn hình mới.

Kiểm tra đã chạy trên server: mua ngay không thay đổi giỏ; idempotency; chọn một dòng giữ nguyên dòng không chọn; nhiều shop chia đơn và đối soát tổng; hash cũ bị từ chối; chủ shop khác bị chặn; xác nhận→giao→nhận; chat chống trùng và phân quyền; sự kiện WebSocket riêng; bộ lọc thương hiệu/sao; đề xuất giữ toàn catalog; giá thẻ khớp quote SKU. Báo cáo riêng trong `.tools/checkout-chat-verification.json`, `.tools/checkout-edge-verification.json`, `.tools/checkout-public-verification.txt`.

Browser đã kiểm tra bảng phân loại, checkout, chọn địa chỉ/quay về, voucher và checkbox giỏ ở màn hình 390px; trang chủ ở 390/768/1440px. HTTPS/API dùng chung/WSS promotion qua Cloudflare đã qua kiểm thử. Chưa thay thế kiểm thử APK trên điện thoại thật, đăng nhập provider và thanh toán cổng thật. Trạng thái giao hàng đang là luồng vận hành nội bộ; không tự đặt vận chuyển hoặc chuyển tiền với nhà cung cấp bên ngoài.
