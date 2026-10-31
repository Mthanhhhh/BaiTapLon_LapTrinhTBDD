# Pull code và dùng server chung

API của nhóm: `https://api-eshop.mtcord.io.vn`. Database và backend chạy trên máy chủ của chủ dự án. Máy thành viên chỉ chạy frontend, không cần Java, Docker, MySQL, Kafka, Redis hoặc Elasticsearch.

## Lần đầu trên máy thành viên

Cài Git và Node.js 24 LTS (Expo SDK 57 yêu cầu tối thiểu Node 22.13). Sau đó:

```bash
git clone https://github.com/Mthanhhhh/BaiTapLon_LapTrinhTBDD.git
cd BaiTapLon_LapTrinhTBDD/apps/mobile
npm ci
npm run web -- --port 8082
```

Mở `http://localhost:8082`. API mặc định đã là server chung. Không cần sao chép file secret nào. Nếu trước đây có `.env`, `.env.local` hoặc biến môi trường `EXPO_PUBLIC_API_URL` trỏ về localhost/10.0.2.2, đổi riêng biến đó thành:

```dotenv
EXPO_PUBLIC_API_URL=https://api-eshop.mtcord.io.vn
```

Khởi động lại Expo sau khi đổi env. Không thay toàn bộ file env của người khác bằng bản mẫu vì có thể mất các cấu hình riêng của họ.

## Máy đã có repository

Tại thư mục repository:

```bash
git switch main
git pull --ff-only origin main
cd apps/mobile
npm ci
npm run web -- --port 8082
```

Nếu Git báo còn thay đổi chưa commit hoặc nhánh đã phân kỳ, giữ lại công việc đó rồi xử lý merge với nhóm; không dùng `reset --hard` để bỏ qua lỗi.

## Điện thoại

- Sau khi có APK: cài cùng bản APK, đăng ký/đăng nhập và dùng qua Wi-Fi hoặc 4G/5G. Không cần Expo hay backend trên điện thoại.
- Khi phát triển: chạy `npm start` trên máy thành viên để dùng Metro. Điện thoại phải kết nối được Metro để tải bundle; kết nối dữ liệu ứng dụng vẫn đi qua API chung. Đăng nhập OAuth native cần bản build có scheme `eshop`, không dùng Expo Go để xác nhận luồng OAuth.
- Hai thiết bị đăng nhập cùng tài khoản sẽ thấy cùng giỏ hàng/đơn mua. Tài khoản khác có dữ liệu riêng. Đơn bán nằm trong Quản lý shop.
- Tài khoản shop thử nghiệm nhận riêng từ chủ dự án; danh sách mật khẩu không được commit lên GitHub. Có thể tự đăng ký tài khoản người mua trên app.

## Chủ server cần làm trước buổi demo

Máy chủ phải bật, có Internet, đã đăng nhập Windows và Docker Desktop hoạt động. Chạy:

```powershell
.\scripts\start-cloud-server.ps1
```

Cloudflared service phải Running, tunnel `eshop-server` phải Healthy. Đăng nhập lại một lần nếu phiên cũ được tạo trước khi đổi khóa JWT. Xem chi tiết ở [SELF_HOSTED_SERVER.md](SELF_HOSTED_SERVER.md).

Kiểm tra từ mạng khác: `https://api-eshop.mtcord.io.vn/api/v1/categories` phải trả JSON. Nếu tên miền chưa phân giải ở một mạng do mới chuyển nameserver, chờ DNS cập nhật trước khi kết luận frontend lỗi. Nếu API ngừng hoạt động, thành viên không cần dựng database thay thế; liên hệ chủ máy chủ để chạy lại hệ thống.

Pull code không tải database, ảnh upload hay secret về máy thành viên. Dữ liệu hiện tại vẫn ở server và các nguồn ảnh. Thay đổi trên dữ liệu dùng chung ảnh hưởng các thành viên khác; không chạy script seed/cleanup hoặc tự triển khai backend cục bộ vào server chung.

## Khi cập nhật backend trên máy chủ

Pull code không tự thay JAR đang chạy. Chủ server cần build các service đã thay đổi, kiểm tra migration cần thiết rồi chạy `start-cloud-server.ps1 -Restart`. Không chạy lại seed hoặc xóa volume để cập nhật code. Không chia sẻ `.env.server.local`, `services/auth-service/.env.local`, khóa ký APK, bản sao lưu database hoặc token Cloudflare qua Git.
