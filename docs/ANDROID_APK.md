# APK cài thử E-Shop

Bản ngày 02/11/2026: version `1.0.0`, versionCode `2`, build EAS `15026468-c81b-4b94-a8fe-fd885169a9ac` đã thành công. File local: `dist/apk/E-Shop-1.0.0-test.apk`; checksum và metadata cạnh file. [Tải APK từ EAS](https://expo.dev/artifacts/eas/2ym-Q32HUC_SHFx4MWjY7nyGEWW9zaX7i10rNLV50aU.apk).

- Expo project: `@mthanh/eshop-tbdd`.
- Android package: `vn.io.mtcord.eshop`; URL scheme: `eshop`.
- Profile `preview` tạo APK release cài trực tiếp, không cần Metro/Expo Go.
- API được đóng gói: `https://api-eshop.mtcord.io.vn`. Tất cả thiết bị kết nối cùng backend/database. Máy chủ cá nhân, Docker và Cloudflare Tunnel cần đang chạy và có Internet.
- Chỉ source mobile được tải lên EAS theo `.easignore`. Database, backup, cấu hình backend và secret không được đóng gói vào APK.

## Build lần sau

Trong `apps/mobile`, tăng `expo.android.versionCode` trong `app.json`, rồi chạy:

```powershell
npx expo install --check
npx tsc --noEmit
npx expo lint
npx eas-cli@latest build --platform android --profile preview
```

Giữ nguyên package và khóa ký Android đang lưu trên EAS để bản sau cập nhật được lên bản trước. Không cần Google Play Console cho APK cài thử. Nếu `npm ci` trên Linux báo thiếu dependency trong lockfile, tạo lại lockfile từ manifest trong thư mục sạch không có `node_modules`, rồi kiểm tra `npm ci --dry-run --include=dev` trước khi build; không bỏ kiểm tra lockfile trên EAS.

## Cài và test

1. Mở link APK trên điện thoại Android, tải file, cho phép trình duyệt/trình quản lý tệp cài ứng dụng từ nguồn đó rồi mở file APK.
2. Đăng nhập tài khoản hiện có. Thử bằng Wi-Fi và dữ liệu di động khi máy chủ đang mở.
3. Kiểm tra trang chủ, chọn phân loại, giỏ hàng có tick chọn, địa chỉ/map, voucher, COD, đơn mua, chat và nhận thông báo lúc app đang mở.
4. Đăng nhập chủ shop trên thiết bị khác để xác nhận/giao đơn và trả lời chat; kiểm tra cập nhật trạng thái trên máy khách.
5. Google/Facebook mở trình duyệt hệ thống rồi quay lại app qua `eshop://oauth/callback`; cần kiểm thử đăng nhập và đồng ý trực tiếp trên thiết bị.

Thông báo hiện tại qua WebSocket/polling khi app hoạt động; chưa cấu hình push notification khi app bị đóng. Chuyển trạng thái giao hàng là luồng nội bộ, chưa đặt vận chuyển hay trừ tiền thật ở nhà cung cấp bên ngoài.
