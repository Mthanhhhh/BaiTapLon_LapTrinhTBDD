# Đối chiếu với mô hình booking trong ảnh

Mốc kiểm chứng: 2026-11-02. Đồ án là TMĐT; giữ chỗ tương đương giữ tồn kho.

| Hạng mục trong ảnh | Hiện trạng của đồ án | Phần còn thiếu / giới hạn |
|---|---|---|
| Dự án microservice | Auth, Product, Order, Payment, Gateway; 4 MySQL và 4 user riêng. CI chặn SQL/import entity xuyên owner. | Các dịch vụ vẫn chạy trên một máy, chưa có HA nhiều máy. |
| Race condition | SQL khóa dòng, cập nhật có điều kiện và Redis Lua; 40 yêu cầu tranh 10 món, đúng 10 thành công. | Chưa kiểm thử mọi tổ hợp lỗi hoặc tải production. |
| Booking, seat (giữ chỗ) | Giữ hàng theo đơn; hủy/hết hạn thì hoàn kho; đối soát giữ hàng mồ côi. | Đây là tồn kho TMĐT, không phải nghiệp vụ ghế booking. |
| Kafka | Sự kiện catalog/tài khoản, command nghiệp vụ, thông báo; đã thử broker dừng và phục hồi. | Một broker, chưa phải cụm HA. |
| Saga | Đặt đơn–giữ kho và thao tác bù hoàn kho qua các transaction riêng. | Chưa có cổng thanh toán thật; chưa kiểm thử đầy đủ mọi bước mất mạng. |
| Outbox pattern | Outbox ghi cùng transaction; retry có lease; thứ tự command theo đơn. | Cần vận hành giám sát backlog/DLT dài hạn. |
| Idempotency | Checkout, inventory ledger, tin nhắn, inbox consumer và version bản chiếu. | Không đồng nghĩa Kafka chỉ giao đúng một lần; hiệu ứng được chống trùng. |
| Các loại khóa DB | FOR UPDATE, SKIP LOCKED ở tác vụ nền, conditional updates. | Không tuyên bố đã dùng mọi loại khóa hay Redlock. |
| Service down, lỗi mạng | Timeout HTTP nội bộ, retry outbox, đối soát Saga; dừng một Product instance vẫn phục vụ 15/15 request; Kafka outage đã thử. | Chưa có circuit breaker và fault-injection toàn diện. |
| Redis | Cache-aside, Lua giữ kho, rate limit, WebSocket pub/sub. | Không thay thế MySQL làm nguồn tồn kho. |
| Notification | Lưu DB, giao command qua Kafka, invalidation qua Redis/WebSocket; chat có kênh riêng. | Chưa có push nền FCM khi ứng dụng đóng. |
| Quan sát để tăng hiệu năng API, đánh giá số liệu | Actuator, logs, Nginx nhiều instance, báo cáo k6: p95 143.71 → 36.63ms, 600 request/lượt, 0% lỗi. | Chưa có Prometheus/Grafana/distributed tracing; mức 20 req/s không phải throughput tối đa. |

Báo cáo phép đo: [INDEPENDENT_SERVICES_VALIDATION.md](reports/INDEPENDENT_SERVICES_VALIDATION.md). Cách chạy, deploy, backup và giới hạn vận hành: [INDEPENDENT_SERVICES.md](INDEPENDENT_SERVICES.md).

## Trạng thái triển khai

- Docker chính chạy với dữ liệu cũ được giữ lại; HTTPS qua Cloudflare Tunnel.
- CI đã chạy thành công trên GitHub cho Java, ranh giới dịch vụ và mobile.
- Workflow CD và runner máy chủ đã cấu hình. Runner cần online để CD thực sự tự chạy; không ghi nhận CD end-to-end thành công khi runner còn offline.
- Mở runner tại máy chủ bằng `.\.tools\github-runner\run.cmd` và giữ tiến trình hoạt động.
