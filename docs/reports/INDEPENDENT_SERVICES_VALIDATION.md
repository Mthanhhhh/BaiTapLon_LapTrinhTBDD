# Kiểm chứng dịch vụ độc lập — 2026-11-02

Đo trên máy Windows/Docker Desktop đang chạy cả stack cũ và stack thử nghiệm. Hai Product instance, hai Gateway instance; Nginx chia tải; MySQL riêng theo dịch vụ. k6 constant-arrival-rate 20 request/giây, 30 giây mỗi lượt; làm nóng 30 request trước mỗi lượt; GET `/api/v1/products/109`, không token. Cùng dữ liệu và script `infra/k6/catalog.js`; chỉ đổi `CACHE_ENABLED` rồi recreate Product.

| Chỉ số | Không cache | Redis cache |
|---|---:|---:|
| Request | 600 | 600 |
| Request/giây | 19.99 | 20.00 |
| Trung bình (ms) | 83.63 | 24.08 |
| p95 (ms) | 143.71 | 36.63 |
| Tỷ lệ lỗi | 0% | 0% |

p95 giảm 74.5%. Bài đo cố định 20 request/giây nên không dùng số này làm mức throughput tối đa hoặc cam kết production. Nhiễu CPU từ các workload khác vẫn tồn tại. Thời gian tối đa không đồng nghĩa p95; đã kiểm tra cả ngưỡng lỗi và p95 của k6.

## Kiểm thử nghiệp vụ

- PASS: 40 yêu cầu đồng thời tranh 10 món; đúng 10 thành công, không tồn kho âm.
- PASS: gửi lại cùng mã giữ hàng không trừ thêm; hoàn kho hai lần chỉ cộng một lần; fixture đã xóa.
- PASS: mua ngay không xóa sản phẩm trong giỏ; mua giỏ nhiều shop tách đúng đơn và đúng tổng; replay checkout trả cùng đơn.
- PASS: người bán khác bị từ chối; chủ shop xác nhận → gửi hàng → khách nhận.
- PASS: chat lưu DB, deduplicate tin nhắn, kiểm tra quyền, số chưa đọc; WebSocket nhận tin sau commit.
- PASS: dừng Kafka, bản ghi outbox còn nguyên; khởi động lại tự giao; phát lại cùng command chỉ có một hiệu ứng inbox/thông báo.
- PASS: CORS cho phép localhost:8082, từ chối nguồn lạ; public `/internal/**` trả 404.
- PASS: 16 request phân phối 8/8 vào hai Product và 8/8 vào hai Gateway.

Các phép thử tạo giao dịch QA được chạy trên database staging riêng, không ghi vào database nguồn đang phục vụ người dùng. Không có thanh toán ngân hàng thật.

## Kiểm tra sau triển khai

- 47 backend unit tests và 3 bài test batch loader; CI GitHub đã đạt.
- Giữ nguyên số bản ghi từ nguồn: 414 tài khoản, 1.140 sản phẩm, 55.471 đơn, 54.833 bản ghi thanh toán (lịch sử demo; không phải khoản thu ngân hàng thật).
- Quyền DB của cả bốn app từ chối truy cập schema khác.
- HTTPS trả 200 cho health, chi tiết sản phẩm, cấu hình OAuth và trang web.
- Mở shop qua owner API idempotent; vai trò SELLER được cấp qua Kafka; bản ghi QA đã xóa.
- Redis rate limit: 20 request hợp lệ với ngưỡng, 5 request tiếp theo bị HTTP 429 trên IP QA riêng.
- Dừng một Product instance: 15/15 request vẫn HTTP 200; sau phép thử khôi phục đủ hai instance.
- WebSocket với Origin web hợp lệ nhận CONNECTED; Origin lạ bị 403.

CI và CD là hai bước riêng: CI đã được kiểm chứng; CD end-to-end còn cần runner máy chủ online.
