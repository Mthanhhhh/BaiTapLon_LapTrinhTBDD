# Đối chiếu công nghệ A–H

Đối chiếu với mã nguồn hiện tại và bằng chứng chạy thử. Không xét số lượng bảng database.

Trạng thái: **Đã** = có triển khai; **Một phần** = còn thiếu tiêu chí; **Chưa** = chưa có; **Làm hơn** = vượt phạm vi kế hoạch ban đầu. Đã triển khai không đồng nghĩa đã được kiểm toán production toàn diện.

## A. Mobile

| Mã | Trạng thái | Hiện trạng |
|---|---|---|
| A1 | Một phần | React Native + Expo + TypeScript strict có; vẫn còn nhiều any. |
| A2 | Đã | React Navigation, tab và màn con; đã mở rộng thông báo, chat, seller/admin. |
| A3 | Đã | Axios gắn token, refresh khi 401, xếp hàng request chờ refresh, chuẩn hóa lỗi. Chất lượng bảo mật refresh backend xem E2–E3. |
| A4 | Đã | React Query cache và useInfiniteQuery; phân trang catalog, shop, đánh giá. |
| A5 | Đã | SecureStore trên native, localStorage trên web; cache lần đọc access token native. |
| A6 | Đã | Pastel, Plus Jakarta Sans, component dùng chung, Aurora động. |
| A7 | Một phần | Web và APK đã chạy; API lấy từ EXPO_PUBLIC_API_URL. Chưa xác nhận lại Expo Go với bản SDK hiện tại. |

## B. Backend

| Mã | Trạng thái | Hiện trạng |
|---|---|---|
| B1 | Đã | Java 21, Spring Boot 3.5.16; Gateway dùng Spring Cloud 2025.0.3. |
| B2 | Đã | REST /api/v1, ApiResponse, PageResponse và xử lý lỗi tập trung. |
| B3 | Đã | JPA/Hibernate; JdbcTemplate cho truy vấn, nghiệp vụ cần kiểm soát SQL. |
| B4 | Đã | Security, JWT access/refresh, BCrypt, BUYER/SELLER/ADMIN. JWT hardening đã bổ sung: xem E2–E3. |
| B5 | Đã | Bean Validation ở DTO và kiểm tra nghiệp vụ phía server. |
| B6 | Làm hơn | Đã chuyển từ modular monolith sang 4 dịch vụ, 4 MySQL độc lập; mỗi dịch vụ chỉ dùng database của mình. Trao đổi qua API/Kafka, bản chiếu cục bộ. |
| B7 | Một phần | Monolith cũ có springdoc/Swagger; POM của 4 service độc lập chưa có springdoc. Endpoint tài liệu bị chặn ngoài môi trường dev; cần bổ sung OpenAPI cho kiến trúc mới. |
| B8 | Đã | Actuator health và Docker healthcheck. |
| B9 | Đã | CORS allow-list, kiểm tra Origin WebSocket; có kiểm thử nguồn được phép và bị chặn. |

## C. Database

| Mã | Trạng thái | Hiện trạng |
|---|---|---|
| C1 | Làm hơn | MySQL 8, bốn database nằm trên bốn container riêng; không còn dùng chung một MySQL cho hệ thống đang chạy. |
| C2 | Đã | SQL schema/migrations, user riêng quyền DML tối thiểu; giữ lịch sử demo đã được yêu cầu. Setup mới không tự nhập bản backup riêng tư. |
| C3 | Đã | Docker Compose quản lý MySQL và volume bền vững. |

## D. Hiệu năng và chịu tải

| Mã | Trạng thái | Hiện trạng |
|---|---|---|
| D1 | Đã | Redis cache-aside sản phẩm/danh mục, TTL, invalidation; lỗi cache quay về DB. |
| D2 | Đã | Lua giữ kho nguyên tử kết hợp SQL khóa dòng/conditional update; thử 40 yêu cầu tranh 10 món đạt. |
| D3 | Đã | Rate limit dùng chung Redis ở Gateway, giới hạn checkout và Nginx; có kiểm thử HTTP 429. |
| D4 | Đã | Nginx chia tải nhiều Gateway/Product/Order; đã kiểm tra phân phối và dừng một Product instance. |
| D5 | Đã | k6 trước/sau cache: 600 request/lượt, khoảng 20 req/s, 0% lỗi; p95 143.71 → 36.63ms. Không phải phép đo throughput tối đa. |
| D6 | Đã trong phạm vi đơn/tồn kho | Kafka, transactional outbox, Saga giữ/hoàn kho, inbox/version chống trùng, retry và DLT. Chưa có Saga qua cổng thanh toán tiền thật. |
| D7 | Đã | Elasticsearch và đồng bộ catalog; có đường tìm kiếm SQL dự phòng. |
| D8 | Làm hơn | Đã tách cả Auth, Product, Order, Payment và thêm Gateway. |
| D9 | Đã | Prometheus + Grafana đang chạy; 18 panel, scrape đủ 8 instance, JVM/HTTP/Hikari/Outbox, 8 alert rules và test firing/recovery. Monitoring chỉ mở loopback, metrics có token riêng; chưa cấu hình gửi cảnh báo ra email/webhook. |
| D10 | Chưa | Chưa dùng MongoDB; audit hiện lưu MySQL. |

## E. Bảo mật

| Mã | Trạng thái | Hiện trạng |
|---|---|---|
| E1 | Đã bổ sung, giữ tương thích | BCrypt cũ giữ nguyên; mật khẩu mới >=8 ký tự, <=72 byte UTF-8; lỗi đăng nhập chung. |
| E2 | Đã bổ sung | Secret bắt buộc từ env, Base64 >=32 byte, issuer/audience, access 15 phút và phân biệt token_use; cửa sổ chuyển tiếp JWT cũ có hạn. |
| E3 | Đã bổ sung | Lưu SHA-256 refresh, xoay vòng một lần, phát hiện reuse và thu hồi family; logout-all qua security_version. |
| E4 | Đã bổ sung | 5 lần sai khóa 5 phút; SQL lock chống race, giới hạn đăng nhập/challenge qua Gateway và Redis. |
| E5 | Có, cần kiểm thử hồi quy liên tục | RBAC, ownership và trạng thái tài khoản trên service; kiểm thử HTTP buyer/admin/IDOR. |
| E6 | Có và bổ sung | Giá/stock server, whitelist sort, page/size/body/JSON bounded, Bean Validation. |
| E7 | Đã bổ sung | Ingress ẩn debug/docs/actuator nhạy cảm; CSP/HSTS/header, CORS allow-list, error redaction. |
| E8 | Đã bổ sung | Env private, example không secret, gitleaks lịch sử và CI; allow-list chỉ public catalog hashes và nonce test. |
| E9 | Đã bổ sung | 4 DB riêng, không publish DB; app không có DDL và audit chỉ SELECT/INSERT. |
| E10 | Giới hạn theo tích hợp | Chặn PAN/CVV, chỉ nhận token; checkout có idempotency. Chưa có merchant nên không bật thu tiền/token hóa ngân hàng thật. |
| E11 | Đã bổ sung | Audit đăng nhập, token, QR, reset và write API theo domain, request ID; quyền app không xóa/sửa audit. Chưa nối SIEM/paging. |
| E12 | Đã bổ sung pipeline | npm audit, gitleaks, Trivy image, ZAP passive baseline trong CI. Kết quả chạy và giới hạn xem SECURITY_VERIFICATION.md. |
| E13 | Đã | STRIDE và OWASP Top 10 2025 trong SECURITY_THREAT_MODEL.md. |

## F. Kiểm thử

| Mã | Trạng thái | Hiện trạng |
|---|---|---|
| F1 | Đã | JUnit 5/Mockito; 63 test backend chạy đạt ở workspace, gồm 2 MockMvc. |
| F2 | Đã | MockMvc trong Maven verify của Product, cùng các script kiểm thử API/DB/Redis/Kafka đã có. |
| F3 | Đã | Postman smoke collection; Newman local đạt 13 request, 22 assertion. |
| F4 | Đã | Jest + React Native Testing Library cho giỏ nhanh, 3 bài test Node cho batch loader. CI có bước chạy cả hai. |
| F5 | Đã | Ma trận tổng hợp Pass/Fail và phạm vi từng môi trường trong TEST_MATRIX.md. |
| F6 | Đã | Có script, JSON kết quả và báo cáo k6 trước/sau Redis. |

Xem [ma trận kiểm thử](TEST_MATRIX.md) để phân biệt lượt chạy mới, kết quả đã lưu và các ca cần thiết bị hoặc merchant.

## G. Triển khai và vận hành

| Mã | Trạng thái | Hiện trạng |
|---|---|---|
| G1 | Đã | Dockerfile backend/web, Compose toàn hệ thống, lệnh khởi động một bước. |
| G2 | Đã | GitHub, nhánh/commit, hợp nhất và push main. |
| G3 | Đã | Actions build/test 5 dịch vụ, TypeScript/lint và test mobile; CI main đã đạt. |
| G4 | Đã | CI main → preflight đúng SHA → runner Windows → build/backup/migrate/deploy → kiểm tra HTTPS/monitoring đã chạy thành công, run 41577038006. Có khóa chống deploy đồng thời, chặn nhánh khác và rollback image khi lỗi. Runner cần giữ online. |
| G5 | Đã | HTTPS qua Cloudflare Tunnel; API công khai đã kiểm tra. |
| G6 | Đã | README và tài liệu khởi động, cập nhật, backup, rollback, dùng chung server cho nhóm. |
| G7 | Đã ở cấu hình hiện tại | Secret trong file riêng bị ignore, có example, không đóng secret vào image/APK; đã quét lịch sử bằng gitleaks và thêm gate trong CI. |

## H. Seller và admin

| Mã | Trạng thái | Hiện trạng |
|---|---|---|
| H1 | Đã | API seller/admin cho catalog, tồn kho, đơn, người dùng, danh mục và khuyến mãi; prefix một số API nằm dưới /api/v1/orders. |
| H2 | Đã về chức năng | Có giao diện quản lý seller/admin trong Expo/React Native Web. React + Vite + Ant Design là stack từng cân nhắc trong danh sách tự chọn. |
| H3 | Đã | Upload và phân phối ảnh qua Cloudinary. |

## Phần làm thêm ngoài kế hoạch ban đầu

- Voucher cá nhân hóa, shop/sàn/vận chuyển tách lớp; ngân sách/quota và tự chọn tổ hợp hợp lệ tốt nhất.
- Flash sale realtime, giữ hàng, chống bán vượt và xử lý hủy/hết hạn.
- Chat buyer–shop, unread, WebSocket và thông báo trạng thái đơn.
- Mở shop theo hồ sơ, seller/admin riêng, doanh thu/thuế/phí cấu hình theo shop, trả hàng và ghi nhận chứng từ hoàn tiền.
- OAuth Google/Facebook, callback mobile; địa chỉ mặc định, bản đồ và ước tính giao hàng.
- AI Gemini hỗ trợ tư vấn/xếp hạng; batch request, giảm N+1, cache token và phân trang.
- Đã có APK cài thử dùng API chung; chưa build lại APK cho mọi thay đổi code mới nhất.

Ưu tiên tiếp theo: cấu hình SMTP/merchant thực tế; cấu hình gửi cảnh báo ra ngoài nếu cần. Không nên xem bộ dữ liệu/lịch sử demo hay thanh toán COD là bằng chứng đã tích hợp thu tiền ngân hàng thật.
