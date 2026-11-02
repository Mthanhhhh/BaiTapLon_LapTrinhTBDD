# Các dịch vụ và database độc lập

Cấu hình hoạt động mới nằm trong `infra/independent/compose.yml`. `services/ecommerce-service` và `infra/docker-compose.yml` là legacy, không chạy đồng thời trên cùng cổng 8080.

## Khởi động

Cần Docker Desktop (Linux containers), PowerShell; build Java 21 và Node 24 diễn ra trong Docker. Chạy tại thư mục repository:

```powershell
./scripts/start-independent.ps1
```

Lệnh tự tạo `.env.independent.local` nếu chưa có, sinh bí mật ngẫu nhiên riêng, build và chạy toàn bộ hệ thống. File đã tồn tại không bị ghi đè. Lần đầu không có bản sao dữ liệu sẽ khởi tạo database rỗng với các vai trò nền tảng; đăng ký tài khoản qua ứng dụng. Không tự thêm người mua, giao dịch hoặc đánh giá.

Trên máy chủ hiện tại, giữ file `.env.independent.local` đã cấu hình và các Docker volumes. `MIGRATION_DATA_DIR` trỏ đến bản xuất dữ liệu cũ riêng tư; không gửi thư mục đó lên GitHub. Muốn nhập dữ liệu lần đầu vào volume mới, dùng bốn file `auth.sql`, `product.sql`, `order.sql`, `payment.sql`, mỗi file chỉ chứa schema của chính nó. Không dùng `down -v` với dữ liệu đang sử dụng.

```powershell
docker compose --env-file .env.independent.local -f infra/independent/compose.yml ps
docker compose --env-file .env.independent.local -f infra/independent/compose.yml logs --tail 100 order-service
docker compose --env-file .env.independent.local -f infra/independent/compose.yml stop
```

## Ranh giới dữ liệu

| Chủ sở hữu | MySQL riêng | Dữ liệu |
|---|---|---|
| Auth | auth-db / auth_db | Tài khoản, token, địa chỉ, thông báo |
| Product | product-db / product_db | Shop, catalog, phân loại, đánh giá, tồn kho |
| Order | order-db / order_db | Giỏ hàng, đơn, voucher, flash sale, chat, hoàn trả |
| Payment | payment-db / payment_db | Thanh toán, sự kiện thanh toán |

Mỗi app chỉ có user DML của database mình. Không có tài khoản root trong app và không có cổng MySQL/Redis/Kafka mở ra máy ngoài. Chỉ Nginx bind `127.0.0.1:PUBLIC_PORT`; Cloudflare Tunnel cung cấp HTTPS công khai.

Các bảng `ref_*` là bản chiếu đọc cục bộ, được cập nhật từ Kafka; không phải truy vấn liên database. Mật khẩu/token không được xuất trong hợp đồng tài khoản. Các thao tác đổi dữ liệu luôn gửi về API/command của chủ sở hữu. API nội bộ yêu cầu `X-Service-Token`, chỉ trong mạng Docker; Nginx chặn `/internal/**`.

Có thể build/restart/scale từng dịch vụ riêng. API có tính nhất quán cuối cùng đối với catalog, tên tài khoản, thông báo; tồn kho và giá trước đặt hàng vẫn được Product kiểm tra theo dữ liệu nguồn. Khi chủ sở hữu không khả dụng, thao tác ghi phụ thuộc vào nó không được giả thành thành công.

## Redis, Kafka và Saga

- Product cache-aside chi tiết sản phẩm: TTL 30 giây, cache categories; lỗi cache đọc lại DB. `CACHE_ENABLED=false` dùng NoOpCacheManager để đo đối chứng.
- Product giữ kho bằng Lua nguyên tử và SQL khóa dòng/conditional update. Redis không thay thế dữ liệu nguồn; SQL vẫn ngăn vượt kho khi Redis lỗi. Redis được sửa theo SQL trong mỗi lần giữ hàng.
- Order giữ quota voucher/ngân sách/flash sale trong transaction của Order. Product giữ tồn kho trong transaction riêng. Nếu Order rollback, gọi bù hoàn kho; nếu cuộc gọi bù lỗi, Product đối soát những lượt giữ quá hạn với Order. Không hoàn kho chỉ vì Order tạm mất kết nối.
- Chốt, hủy, giao, hoàn hàng: command outbox bền vững theo từng đơn, cùng khóa phân vùng Kafka. Inbox đảm bảo xử lý một lần về hiệu ứng, dù thông điệp giao nhiều lần.
- Bản chiếu có version theo từng bản ghi, bỏ qua sự kiện cũ/trùng. Snapshot lần đầu có checkpoint; restart không nhập lại toàn bộ lịch sử.
- Kafka listener retry rồi chuyển `.DLT` khi lỗi liên tục. Cần theo dõi và phát lại thông điệp sau khi sửa nguyên nhân; không xem DLT là xử lý nghiệp vụ thành công.
- Redis chia sẻ giới hạn truy cập gateway và checkout; Nginx có giới hạn độc lập dự phòng. Chat/WebSocket dùng Redis pub/sub giữa các instance, tin nhắn vẫn lưu MySQL.

Một Kafka broker và mỗi database một node phù hợp máy demo; đây chưa phải cụm HA chống hỏng toàn máy. Không bật giao dịch tiền thật khi chưa có hợp đồng/cấu hình cổng thanh toán.

## Nginx và CORS

Nginx chia tải gateway và backend bằng DNS động trong Docker. `--scale product-service=2 --scale order-service=2 --scale api-gateway=2` được hỗ trợ. `X-Gateway-Instance` và `X-Service-Instance` giúp xác minh phân phối.

`CORS_ALLOWED_ORIGINS` là danh sách nguồn chính xác, không dùng wildcard kèm credentials. Mobile native không chịu CORS nhưng vẫn cần JWT/ownership. WebSocket cũng kiểm tra Origin. Bổ sung origin web hợp lệ vào file riêng, rồi recreate gateway/order-service.

## Sao lưu, cập nhật, rollback

```powershell
py -3 scripts/independent-ops.py backup --env .env.independent.local
py -3 scripts/independent-ops.py migrate --env .env.independent.local
./scripts/deploy-independent.ps1 -EnvironmentFile T:/ProjectTBDD/.env.independent.local
```

Backup có dữ liệu riêng tư, nằm trong `.tools/backups` ngoài Git. Migrations có sổ theo dõi, chỉ áp file chưa chạy; migration mới phải thêm file, không sửa file đã áp dụng. Deploy build ảnh theo commit, backup, migrate, recreate, kiểm tra health. Nếu kiểm tra thất bại và có release trước, trả về ảnh cũ; không tự khôi phục DB vì sẽ làm mất các giao dịch mới. Phục hồi DB chỉ dùng bản backup đã chọn trong thời gian dừng ghi.

## GitHub CI/CD và HTTPS

CI chạy Java build/test cho 5 dịch vụ, kiểm tra ranh giới schema, TypeScript/lint và test batch loader. CD chỉ nhận push main đã qua CI hoặc chạy thủ công, dùng runner Windows `eshop-server` trên máy chủ. Không chạy code PR trên runner máy chủ.

Runner được cấu hình trong `.tools/github-runner`; lệnh `./.tools/github-runner/run.cmd` giữ runner online trong phiên Windows. Docker Desktop, cloudflared và runner phải chạy; máy không được sleep khi demo. File môi trường chỉ nằm trên máy chủ, không nằm trong GitHub workflow hay artifact. Có thể xem Actions để kiểm tra CI/CD từng commit.

Cloudflare Tunnel hiện có định tuyến `api-eshop.mtcord.io.vn` tới `http://localhost:8080`. Giữ tên miền này trong APK/web API URL; database chỉ trên server. Trình duyệt nhận HTTPS ở Cloudflare, lưu lượng tunnel được mã hóa tới cloudflared. Không đưa database ra tên miền công khai. OAuth phải giữ callback HTTPS đã đăng ký.

Bạn cùng nhóm chỉ cần pull source và cấu hình `EXPO_PUBLIC_API_URL=https://api-eshop.mtcord.io.vn` theo `docs/TEAM_QUICKSTART.md`; không cần bản sao database hoặc bí mật backend.

## Đo kiểm

`python scripts/check-service-boundaries.py` chặn SQL/import entity xuyên dịch vụ. `infra/k6/catalog.js` đo 20 request/giây trong 30 giây, ngưỡng lỗi <1%, p95 <1500ms. Đổi `CACHE_ENABLED` rồi recreate Product để so sánh. Báo cáo đo trên máy thực tế sẽ nêu rõ cấu hình và giới hạn, không suy ra sức chịu tải production từ một bài test ngắn.
