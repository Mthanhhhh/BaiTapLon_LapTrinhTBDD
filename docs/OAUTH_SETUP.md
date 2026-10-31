# Bật đăng nhập Google/Facebook thật

Hai nút sử dụng Expo AuthSession để mở cửa sổ/tab đăng nhập của nhà cung cấp. WebBrowser hoàn tất callback, AuthSession kiểm tra state, Google dùng PKCE, backend đổi authorization code lấy token và đọc hồ sơ trực tiếp từ nhà cung cấp. Không còn chọn tài khoản mẫu hay đăng nhập bằng email tự nhập. Secret chỉ ở backend.

## 1. Google — làm trước

1. Mở [Google Cloud Console](https://console.cloud.google.com/), tạo/chọn project dành cho E-Shop.
2. Vào **Google Auth Platform**. Điền Branding (tên ứng dụng E-Shop, email hỗ trợ), chọn Audience phù hợp; khi đang Testing, thêm email bạn dùng thử vào Test users.
3. Vào **Clients → Create client → Web application**.
4. Thêm Authorized JavaScript origin: `http://localhost:8082`.
5. Thêm Authorized redirect URI, phải khớp từng ký tự: `http://localhost:8082/oauth/callback`.
6. Sao chép Client ID và Client Secret vào file backend ở bước 3. Không gửi secret vào chat hay commit Git.

Nếu dùng domain/cổng khác, phải đăng ký đúng origin/callback mới và thêm callback đó vào `OAUTH_ALLOWED_REDIRECTS`. Không dùng redirect URI dạng wildcard.

Nguồn: [Google OAuth web-server flow](https://developers.google.com/identity/protocols/oauth2/web-server).

## 2. Facebook / Meta

1. Mở [Meta for Developers](https://developers.facebook.com/apps/), tạo ứng dụng có use case đăng nhập người dùng bằng Facebook.
2. Thêm/cấu hình Facebook Login. Khai báo website của E-Shop; bật Web OAuth Login và Client OAuth Login.
3. Trong Valid OAuth Redirect URIs, đăng ký callback của web. Với môi trường local được Meta chấp nhận, dùng `http://localhost:8082/oauth/callback`. Nếu console yêu cầu HTTPS, dùng domain HTTPS phát triển của bạn, mở E-Shop qua domain đó và cập nhật cùng callback trong cấu hình backend.
4. Lấy **App ID** và **App Secret** ở phần cài đặt ứng dụng. Trong development mode, dùng tài khoản có vai trò admin/developer/tester được Meta cho phép.
5. Chọn Graph API version được hỗ trợ trong dashboard và đặt `FACEBOOK_GRAPH_VERSION` tương ứng. Code có giá trị mặc định `v24.0`; không khẳng định đây là bản mới nhất.
6. Luồng yêu cầu `public_profile` và `email`. Nếu tài khoản không cung cấp email hoặc không cấp quyền, ứng dụng báo lỗi và giữ phương thức mật khẩu; không tự tạo email giả.

Nguồn: [Facebook Login manual flow](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow/). Tên menu/điều kiện xuất bản có thể khác theo loại ứng dụng và trạng thái xét duyệt; cần hoàn thành yêu cầu trong dashboard trước khi cho người dùng công khai đăng nhập.

## 3. Điền cấu hình và chạy

Copy `services/auth-service/.env.example` thành `services/auth-service/.env.local` (file này bị Git bỏ qua), rồi điền:

```dotenv
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-secret
FACEBOOK_APP_ID=your-meta-app-id
FACEBOOK_APP_SECRET=your-meta-app-secret
FACEBOOK_GRAPH_VERSION=v24.0
OAUTH_ALLOWED_REDIRECTS=http://localhost:8082/oauth/callback
```

Để trống thông tin nhà cung cấp chưa tạo. Có thể bật Google trước, Facebook sau. Spring Boot không tự đọc file `.env`; script dưới đây nạp các biến được cho phép rồi build và chạy lại đúng auth-service:

```powershell
cd T:\ProjectTBDD
.\scripts\start-auth-oauth.ps1
```

MySQL, API Gateway và Expo web phải đang chạy. Sau đó tải lại web; bấm Google/Facebook. API `GET /api/v1/auth/oauth/config` chỉ trả Client ID công khai và trạng thái đã cấu hình, không trả secret. Nếu bạn vừa cấu hình mà nút vẫn báo chưa kết nối, tải lại trang để lấy cấu hình mới.

## 4. Phạm vi kiểm chứng

- Backend có kiểm thử từ chối email-only login, nhà cung cấp không hỗ trợ, callback không nằm trong whitelist, thiếu PKCE, Google chưa xác minh email, Facebook token sai App ID và nhà cung cấp từ chối code.
- Chưa thể nghiệm thu đăng nhập Google/Facebook đầu-cuối khi chưa có ứng dụng/credentials thật. Không dùng ID hoặc tài khoản giả để coi là đã đăng nhập thành công.
- Luồng đang được cấu hình cho **web**. Nút trên native sẽ thông báo cần cấu hình riêng. Android/iOS cần đăng ký client/app riêng và development build; scheme `eshop` đã khai báo nhưng chưa đủ để chạy OAuth native. Không coi Expo Go là đã hỗ trợ OAuth native.
- Tài khoản hiện được đối chiếu bằng email do nhà cung cấp trả về. Hệ thống chưa có màn hình liên kết/hủy liên kết nhiều danh tính nhà cung cấp theo subject ID; cần bổ sung trước khi dùng chính sách liên kết tài khoản phức tạp.

Nguồn: [Expo authentication guide](https://docs.expo.dev/guides/authentication/).
