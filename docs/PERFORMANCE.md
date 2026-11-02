# Performance: đường tải dữ liệu và danh sách

## Đã tối ưu

1. **Batch fetching thay cho N+1.** Trang sản phẩm lấy tên danh mục bằng một truy vấn cho cả trang; Hibernate batch shop và phân loại tối đa 32 đối tượng. Không join-fetch collection cùng pagination để tránh nhân hàng và phân trang trong bộ nhớ.
2. **Request-scoped memoization cho báo giá danh sách.** Các SKU trong một request dùng lại thông tin voucher, điều kiện khách, lượt dùng, phí giao và chính sách VAT theo shop. Không dùng chung cache giữa người mua/request; checkout vẫn đọc lại điều kiện, quota, ngân sách và tồn kho hiện tại.
3. **Batch loader phía app.** Gom yêu cầu giá của các thẻ, loại ID trùng, chia tối đa 60 ID/request. Kết quả thiếu trả `null` thay vì `undefined` khiến React Query báo lỗi/retry; lỗi một chunk không để các Promise còn lại treo. Tách batch theo tài khoản.
4. **Windowed rendering + memoization.** Trang chủ/search dựng đầu 6 phần tử, mỗi batch 6; window trang chủ 7 màn hình, tìm kiếm 5. Memo hóa dữ liệu gộp trang và callback; row trang chủ có callback ổn định. Tìm kiếm không gọi thêm trang khi đang tải trang trước.
5. **Tải theo nhu cầu.** Home/search và giá trên các thẻ không refetch khi tab không được chọn. Axios nhận AbortSignal của query để hủy yêu cầu tìm kiếm đã bỏ. Danh mục/filter options có stale time 5 phút; các biến động tài chính vẫn kiểm tra ở checkout.
6. **Giảm refetch và render.** Gộp WebSocket invalidation trong 400ms; không gọi lại toàn bộ dữ liệu ngay lần socket kết nối đầu. Reconnect vẫn revalidate. Đồng hồ flash sale là component riêng, tick mỗi giây không dựng lại toàn bộ strip sản phẩm. Đồng hồ server chỉ cập nhật offset khi lệch hơn 1 giây, tránh render consumer vì vài ms jitter.
7. **Polling dự phòng.** Thông báo chỉ có một poller dùng chung tại NotificationToast; badge/list đọc cùng React Query cache. Chu kỳ từ 2 giây xuống 15 giây (30 xuống 4 lần/phút cho một query). Sự kiện WebSocket vẫn invalidation ngay trong đợt gộp; polling dự phòng khi không có sự kiện. App background không poll thông báo. Chat cũng chỉ có một poller inbox 30 giây tại ChatLive; WebSocket chỉ invalidation đúng inbox/hội thoại nhận sự kiện, bỏ refetch thừa từ CONNECTED đầu tiên. Màn hình chat không poll nội dung khi mất focus.
8. **Native token read-through cache.** Gộp các lần đọc SecureStore access token trong một phiên, cập nhật khi login/refresh/logout; refresh token vẫn ở SecureStore. Web tiếp tục đọc localStorage để thấy cập nhật tab khác.
9. **Giới hạn chờ mạng.** API timeout 20 giây, refresh token 15 giây thay vì chờ không giới hạn.

Các thay đổi này giữ React Navigation hiện có, không migrate framework trong lượt tối ưu; thay navigation toàn app không giải quyết các truy vấn lặp đã đo và tăng phạm vi hồi quy.

## Số đo trước / sau

Đo tuần tự 3 request/endpoint tại máy demo, cùng 20 sản phẩm, không có lịch sử tìm kiếm ở endpoint đề xuất. Bảng là trung vị của 3 request, gồm cả request làm nóng. Đây là kiểm tra nhỏ, không phải load test, p95, FPS hay benchmark APK. Trạng thái HTTP 200 và số byte JSON không đổi giữa hai lượt.

| API | Nội bộ trước | Nội bộ sau | Qua Cloudflare trước | Qua Cloudflare sau |
|---|---:|---:|---:|---:|
| Đề xuất không gọi AI | 192 ms | 92 ms | 327 ms | 311 ms |
| Danh sách 20 sản phẩm | 107 ms | 59 ms | 245 ms | 185 ms |
| Giá/voucher 20 sản phẩm | 432 ms | 308 ms | 475 ms | 314 ms |

AI với lịch sử tìm kiếm vẫn có thể chờ Gemini ở phiên chưa cache (timeout hiện tại 10 giây); không suy diễn số đo dòng đầu thành độ trễ Gemini. Mạng Internet, trạng thái JIT/database cache và tải máy làm số đo dao động.

Chạy lại:

```powershell
cd T:\ProjectTBDD
node scripts/benchmark-performance.mjs .tools/performance-api.json
node --test apps/mobile/tests/batchLoader.test.mjs
```

Các request benchmark chỉ đọc dữ liệu và báo giá; không đặt đơn hoặc giữ hàng. File JSON riêng trước/sau: `.tools/performance-before.json`, `.tools/performance-after.json`.

## Kiểm tra tính đúng

- 3 test batch loader: gom ID trùng, phân tách tài khoản, chunk giới hạn, null kết quả thiếu và lỗi chunk không làm treo chunk sau.
- 2 test request memoization: đọc một lần trong một batch, không tái dùng qua request khác.
- 1 test product page: tải tên danh mục một lần thay vì gọi từng ID.
- Các test pricing, checkout scope, finance, trả hàng và AI hiện có tiếp tục qua.
- API: báo giá theo tài khoản đối chiếu bằng SKU với quote checkout; trang sản phẩm còn đủ danh mục/shop/tồn. Khách chưa đăng nhập chỉ được xem giá, không dùng endpoint quote cần đăng nhập.
- TypeScript và lint phải qua trước bàn giao; lint còn các cảnh báo hiện có của dự án. Không build APK trong lượt tối ưu này.

## Công nghệ nên cân nhắc tiếp

- **expo-image:** cache ảnh memory/disk và dùng ảnh thumbnail vừa kích thước. Phù hợp nếu profiling APK cho thấy decode/tải ảnh chiếm nhiều thời gian. Chưa thêm native dependency hoặc đổi thư viện ảnh trong lượt này.
- **FlashList:** tái sử dụng view khi danh sách dài, sau khi đo release APK và so sánh với FlatList đã chỉnh window. Không mặc định thay tất cả list nếu chưa có số đo cuộn trên thiết bị.
- **Micrometer/Actuator + tracing OpenTelemetry:** đo p95/p99, SQL count và thời gian gateway/service/database thay vì dựa cảm giác. Actuator đã có; chưa triển khai collector hoặc dashboard mới.
- **Redis hiện có:** cache dữ liệu công khai và reference data có TTL/invalidation khi cần. Không cache kết quả checkout dùng chung giữa khách.
- **AI precompute:** có thể chuyển xếp hạng AI cold sang background, giữ snapshot thứ tự phân trang; cần thiết kế riêng để không đảo sản phẩm giữa trang. Chưa thay đổi luồng AI đồng bộ hiện tại.

Không thêm Kafka, thêm microservice, đổi database hay nâng framework trong lượt này. Tối ưu tập trung đường nóng đã đo, không khẳng định toàn codebase đã được rewrite/kiểm chứng hiệu năng trên mọi thiết bị.

Nguồn kỹ thuật chính thức: https://docs.hibernate.org/orm/6.5/introduction/pdf/Hibernate_Introduction.pdf ; https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults ; https://reactnative.dev/docs/optimizing-flatlist-configuration ; https://docs.expo.dev/versions/v57.0.0/ .
