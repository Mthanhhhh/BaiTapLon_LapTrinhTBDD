# Voucher, Flash sale và WebSocket

Triển khai trong order-service, dùng MySQL 8, Redis, Kafka và WebSocket qua API gateway. Không thêm chương trình thương mại giả, ngân sách giả hay lượt bán giả vào catalog. Shop/quản trị viên tạo ưu đãi từ thông tin của mình.

## Sử dụng

- Khách: Trang chủ → **Ưu đãi**; Tài khoản → **Kho voucher**. Có Flash sale, mã shop/sàn/vận chuyển, lưu/bỏ lưu, mã sắp hết hạn, lịch sử đã dùng/giữ và nhắc giờ mở.
- Shop: Tài khoản → Quản lý shop → **Voucher, Flash sale & thống kê**. Tạo chương trình, chọn nhiều SKU, nhập giá/quota/giới hạn mỗi khách, ngân sách, giờ bắt đầu/kết thúc, điều kiện cộng dồn và dừng nhận lượt mới.
- Quản trị viên có role `ADMIN`: tạo mã sàn/vận chuyển qua mục quản lý ưu đãi trong tài khoản. Người dùng thường không được tự cấp role qua API.
- Checkout mặc định chọn tổ hợp tiết kiệm nhất; có thể chuyển sang nhập/chọn mã thủ công. Tối đa một mã mỗi tầng SHOP → PLATFORM → SHIPPING. Mã không cộng dồn được dùng riêng. Mã vận chuyển chỉ trừ phí vận chuyển.
- **Chi tiết giá và ưu đãi** trong đơn cho biết giá SKU, mã và tổng tại lúc đặt. Dừng chương trình không đổi giá đơn đã đặt.
- Phí giao ở màn quản lý là chính sách do shop nhập, không phải báo giá trực tiếp của hãng vận chuyển. Chưa cấu hình giữ mức 0đ của hệ thống cũ. Thuế 10% là chính sách có sẵn của ứng dụng, tính trên tiền hàng sau giảm; không phải tích hợp xác định thuế theo từng mặt hàng.

## Giữ hàng và tính đúng số liệu

1. `POST /api/v1/promotions/quote` đọc giá/tồn kho thật và điều kiện hiệu lực, trả `quoteHash` cùng bảng giá. Không tin số tiền client gửi.
2. Checkout gửi `quoteHash` và `idempotencyKey` UUID. Giá/ưu đãi thay đổi thì yêu cầu tính lại, không âm thầm đặt ở giá cao hơn.
3. Khóa giỏ theo tài khoản; cùng key trả đơn cũ kể cả sau khi giỏ được xóa. Key scope theo user.
4. Đơn, snapshot, quota, ngân sách, tồn SKU và outbox ghi trong một transaction InnoDB. Conditional update chống vượt stock/quota/budget; khóa campaign theo ID tăng dần. Giới hạn mỗi khách tính cả lượt đang giữ.
5. COD chốt lượt ngay; online giữ 5 phút. Job quét mỗi 2 giây; thanh toán muộn bị từ chối ngay cả trước lượt quét tiếp theo. Hủy/từ chối/hết hạn/thất bại trả stock và ưu đãi một lần qua trạng thái reservation có khóa.
6. Flash không áp dụng khi SKU ngừng bán, hết stock/quota/budget hoặc khách đạt giới hạn. Catalog là thông tin tham khảo; đặt đơn luôn kiểm tra lại.

**Giả định triển khai:** auth_db, product_db, order_db dùng chung một MySQL instance. Transaction order-service truy cập chéo schema để bảo đảm tính nguyên tử; tài khoản DB cần quyền tương ứng. Đây không phải transaction phân tán giữa nhiều máy DB. Khi tách DB vật lý phải thiết kế reservation API/Saga riêng.

## Redis, Kafka và cập nhật trực tiếp

- Redis cache catalog công khai TTL 1 giây; Lua INCR/EXPIRE giới hạn 30 checkout/user/10 giây; Pub/Sub fan-out invalidation giữa các instance. Redis không quyết định stock/tiền. Mất Redis khi đang chạy vẫn đặt/hủy bằng SQL; rate limit tạm bỏ qua nhưng ràng buộc DB giữ nguyên.
- Outbox ghi cùng transaction. Publisher lease 30 giây, retry khi Kafka lỗi, chỉ đánh dấu gửi sau acknowledgement. ORDER_CREATED vào order-events; sự kiện ưu đãi/nhắc giờ vào promotion-events. Giao nhận **at least once**, không tuyên bố Kafka gửi đúng một lần.
- Consumer nhắc ưu đãi deduplicate bằng `(event_id, consumer_name)` và notification event key. Bù trừ thanh toán khóa order/reservation; stock consumer cũ bỏ qua đơn do engine mới quản lý để không hoàn hai lần.
- `/ws/promotions` là WebSocket thực qua gateway/nginx, không SSE. Chỉ gửi `type` và `serverTime`, không phát giỏ/đơn/tài khoản của người khác. Client đọc lại REST có JWT để lấy dữ liệu của mình.
- Ping/pong, đồng bộ giờ server, reconnect backoff 1–30 giây, kết nối lại khi app về foreground; reconnect tự tải dữ liệu mới. Gateway/backend kiểm tra browser Origin. Native client không có Origin được đọc kênh công khai.
- Xác nhận/giao/nhận đơn cũng phát invalidation cho đơn hàng/thông báo. Polling cũ còn làm dự phòng.
- Dashboard dùng số đơn/giao thành công/ngân sách thực. Doanh thu là tổng thanh toán các đơn đã giao có chiến dịch, không phải doanh thu tăng thêm do chiến dịch. Không cộng các dòng chiến dịch thành doanh thu tổng vì một đơn có nhiều mã.

## Nâng cấp

Migration: `infra/mysql/migrations/20261031_promotions.sql`; bản DB mới tương đương: `infra/mysql/init/09_promotions.sql`. Chỉ tạo bảng, không sửa đơn cũ. Đơn cũ chưa có snapshot được hiển thị đúng trạng thái này.

Sao lưu DB hiện có trước khi chạy migration bằng MySQL client. Khởi động MySQL, Redis, Kafka trước service. Compose bổ sung Kafka KRaft một node với volume bền vững cho local/đồ án. Không xóa container/volume hiện có chỉ để chuyển sang compose.

Order-service dùng các biến DB_HOST/PORT/USERNAME/PASSWORD, REDIS_HOST/PORT, KAFKA_SERVERS. Đặt `PROMOTIONS_ALLOWED_ORIGINS` ở **cả gateway và order-service** (danh sách cách dấu phẩy); mặc định `http://localhost:8082,http://localhost:8087`. Deploy dùng HTTPS/WSS và origin thực.

API voucher cũ vẫn còn; checkout mới dùng promo_*. Không tự nhập voucher legacy sang ngân sách mới vì thiếu thông tin budget/giới hạn đã cam kết.

Thanh toán Visa/Maestro/PayPal hiện vẫn là bộ mô phỏng có sẵn của project, chưa thu tiền thật. Engine mới kiểm tra giữ hàng/giá/bù trừ trên luồng đó. Thu tiền thật cần provider, webhook có chữ ký, idempotency và đối soát/refund của provider.

## Kiểm chứng 31/10/2026

- 8 JUnit test tính giá: PASS.
- 100 tài khoản riêng tranh 10 suất: **10 thành công, 90 từ chối**, khoảng 2,79 giây cho đợt gửi đồng thời local; không phải cam kết throughput production.
- Không vượt stock/budget/quota; retry trả đơn cũ; 5 yêu cầu hủy đồng thời chỉ hoàn một lần.
- Đơn online giữ 5 phút. Test tăng tốc chỉ sửa thời hạn của fixture rồi quan sát job hủy/hoàn, không chờ đủ 5 phút; thanh toán muộn bị chặn.
- Thanh toán mô phỏng thất bại → Kafka bù trừ, không hoàn stock hai lần.
- Xác nhận → giao → nhận, dashboard ghi đúng doanh thu đơn đã giao.
- Nhắc ưu đãi tạo một thông báo; phát lại cùng Kafka event không nhân đôi.
- Pause Kafka: đơn vẫn lưu và outbox gửi bù. Pause Redis: quote/đặt/hủy vẫn đúng.
- WebSocket có CONNECTED/invalidation, không chứa dữ liệu cá nhân; origin lạ bị chặn.
- TypeScript/web export: PASS. Expo lint 0 lỗi, 81 cảnh báo (gồm các cảnh báo legacy). Cấu hình lint giữ chẩn đoán migration React Compiler của Animated ref/form ở mức cảnh báo, không tắt kiểm tra thứ tự Hook.
- Đã tạo voucher và đặt COD qua giao diện mobile, kiểm tra ưu đãi/quản lý/checkout. Inspector 390/768/1440 không có lỗi chặn. Desktop giữ khung 480px như app; ít dữ liệu không được lấp bằng chiến dịch giả.
- Đã dọn 102 tài khoản, shop, sản phẩm và các chiến dịch của bài kiểm thử; catalog thương mại không được chèn dữ liệu mẫu.

Chạy lại trên DB local dùng Docker; fixture gắn nhãn **CHỈ KIỂM THỬ**, không dùng giỏ người dùng hiện có:

```powershell
node scripts/verify-promotions.mjs
node scripts/verify-promotions-resilience.mjs .tools/promotions-test-<run>.json
node scripts/verify-promotions-replay.mjs .tools/promotions-test-<run>.json
node scripts/cleanup-promotions-test.mjs .tools/promotions-test-<run>.json
```

Resilience tạm pause Redis/Kafka, luôn unpause trong finally. File trạng thái .tools chứa tài khoản fixture, bị Git ignore. Cleanup kiểm tra ID, prefix email, tên shop/sản phẩm trước khi xóa, không reset DB. Outbox/consumer journal giữ lịch sử sự kiện kiểm thử để đối chiếu.
