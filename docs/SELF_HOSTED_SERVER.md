# Server dùng chung cho APK

API chính thức của bản demo: `https://api-eshop.mtcord.io.vn`. Cloudflare Tunnel `eshop-server` chuyển hostname này đến `http://localhost:8080` trên máy Windows. Các bản APK dùng cùng API; không chạy database riêng trên điện thoại. Cùng tài khoản sẽ thấy cùng giỏ hàng/đơn mua, tài khoản khác vẫn có dữ liệu riêng và quyền shop riêng.

## Dữ liệu và dịch vụ

Giữ nguyên các container và volume đang có: `ecommerce-mysql` (bốn schema auth_db, product_db, order_db, payment_db), `ecommerce-redis`, `ecommerce-kafka`, `ecommerce-elasticsearch`. Script khởi động dùng `docker start`, không tạo volume thay thế, không chạy seed hoặc xóa dữ liệu. Chỉ Gateway được đưa qua tunnel; database, Kafka, Redis và các service con không cần public hostname. Backend Java lắng nghe trên loopback khi chạy bằng script server.

Mở Docker Desktop rồi chạy PowerShell tại thư mục dự án:

```powershell
.\scripts\start-cloud-server.ps1
```

Khi thay bản build hoặc cấu hình cần khởi động lại:

```powershell
.\scripts\start-cloud-server.ps1 -Restart
```

Sau khi thêm/thay khóa Gemini trong `.env.server.local`, chỉ cần nạp lại product-service:

```powershell
.\scripts\start-cloud-server.ps1 -Restart -Service product-service
```

Khóa được đọc khi service khởi động; sửa file không tự cập nhật tiến trình đang chạy. `.env.example` chỉ chứa tên biến và giá trị mẫu, không điền khóa thật vào file này.

Script đọc OAuth từ `services/auth-service/.env.local`, đọc cấu hình dùng chung từ `.env.server.local`, chạy lần lượt năm JAR và đợi health check. Lần đầu tạo khóa JWT riêng, sau đó giữ ổn định qua các lần chạy. File khóa bị Git bỏ qua; cần giữ lại khi sao lưu/chuyển server. Sau khi đổi khóa, thiết bị cũ đăng nhập lại một lần. Không đưa khóa, database password hoặc tunnel token vào APK.

Log nằm trong `.tools/cloud-server/`. Không khởi động lại bằng các lệnh Java rời thiếu biến môi trường, vì có thể làm các service dùng khóa xác thực khác nhau.

## Tự khởi động

```powershell
.\scripts\enable-cloud-server-startup.ps1
```

Tác vụ `Eshop-Cloud-Server` chạy sau khi người dùng đăng nhập Windows. Bật tùy chọn Docker Desktop tự chạy khi đăng nhập. Connector Cloudflared đang được cài dưới dạng Windows service. Máy phải bật và có Internet; nếu Windows chưa đăng nhập thì tác vụ backend chưa chạy. Khi trình diễn, tắt chế độ ngủ khi cắm điện trong Windows Settings. Script không tự thay đổi chính sách nguồn điện.

## APK

`apps/mobile/eas.json` có profile `preview` và `production`, đều xuất APK độc lập với URL API cố định. Package Android: `vn.io.mtcord.eshop`; scheme: `eshop`. Chưa build APK trong bước cấu hình server. Lần build đầu cần liên kết tài khoản/project Expo và tạo/chọn khóa ký Android, giữ lại khóa để cập nhật APK sau này.

Frontend mặc định dùng API công khai kể cả khi không có file env. Có thể chủ động override bằng `EXPO_PUBLIC_API_URL` khi phát triển; profile APK đã đặt địa chỉ công khai. `EXPO_PUBLIC_*` là cấu hình công khai, không chứa secret. WebSocket tự đổi HTTPS thành WSS và có kết nối lại khi ứng dụng trở về foreground.

## OAuth điện thoại

Google/Meta Web OAuth client cần cho phép chính xác redirect URI:

```
https://api-eshop.mtcord.io.vn/api/v1/auth/oauth/mobile/callback
```

APK mở trình duyệt hệ thống, provider trả mã qua callback HTTPS, backend chuyển mã về `eshop://oauth/callback`; app xác minh state và đổi mã qua backend. Google dùng PKCE. Callback không nhận URL chuyển hướng tùy ý và không chuyển access token trong URL. Client Secret chỉ nằm ở backend.

Google Authorized JavaScript origins dành cho website: giữ origin localhost hiện có; chỉ thêm `https://eshop.mtcord.io.vn` khi website đó được triển khai. APK không dùng JavaScript origin. Facebook cần App ID/Secret và redirect URI tương ứng trên Meta; nếu chưa cấu hình thì nút không thể đăng nhập được. Luồng provider thực tế chỉ xác nhận hoàn toàn sau khi cài APK và người dùng đăng nhập/đồng ý trên provider.

## Kiểm tra

```powershell
node scripts/verify-cloud-server.mjs
```

Nếu DNS hệ thống còn cache sau khi chuyển nameserver, có thể chẩn đoán bằng `node scripts/verify-cloud-server.mjs --public-dns`. Chế độ này chỉ dùng trong công cụ kiểm thử Windows: lấy địa chỉ từ DNS 1.1.1.1, giữ nguyên hostname/SNI và kiểm tra chứng chỉ HTTPS. Không sửa DNS/hosts của máy hay cấu hình APK. Báo cáo ghi rõ cách phân giải đã dùng.

Kiểm tra HTTPS công khai, cùng dữ liệu khi truy cập nội bộ/công khai, hai phiên đăng nhập cùng tài khoản, cách ly giỏ hàng tài khoản khác, lịch sử đơn, báo giá thanh toán, callback OAuth và WSS. Thay đổi giỏ kiểm tra được hoàn trả. Báo cáo `.tools/cloud-server-verification.json`. Kiểm thử không thay thế việc cài APK trên điện thoại, kiểm tra camera/chọn ảnh và đăng nhập provider thực tế.

Sao lưu định kỳ bốn database và giữ các file cấu hình riêng. Không dùng `docker compose down -v`, không chạy khởi tạo/seed lại để xử lý sự cố kết nối. Ảnh Cloudinary/catalog được tải qua HTTPS từ nguồn hiện tại, không đặt đường dẫn ổ đĩa máy chủ trong APK.
