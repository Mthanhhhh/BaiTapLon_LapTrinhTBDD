# Ma trận kiểm thử E-Shop

Kết quả lượt kiểm tra ngày 04/11/2026 tách theo môi trường. **PASS trước đó** trỏ đến báo cáo đã lưu. **Chưa chạy** là phần cần thiết bị hoặc cấu hình bên ngoài.

| ID | Luồng | Kỳ vọng | Kết quả và phạm vi |
|---|---|---|---|
| AUTH-01 | Đăng nhập, refresh, replay, khóa tạm | Token đúng loại, refresh chỉ dùng một lần, tài khoản cũ vẫn đăng nhập được | PASS backend local; kiểm tra HTTPS có trong báo cáo bảo mật |
| AUTH-02 | Hồ sơ và địa chỉ khi chưa đăng nhập | Từ chối truy cập | PASS Newman local |
| AUTH-03 | Google/Facebook | Tải được cấu hình; người dùng đăng nhập qua nhà cung cấp và quay về app | PASS cấu hình qua Newman; chưa chạy lại đăng nhập tương tác trong lượt này |
| CAT-01 | Danh sách, chi tiết, tìm kiếm, lọc | Danh sách đúng cấu trúc và chi tiết đúng ID | PASS Newman local |
| CAT-02 | Đề xuất trang chủ | Từ khóa chuẩn hóa, size giới hạn; phiên phân trang giữ thứ tự | PASS MockMvc và unit test trên workspace |
| CART-01 | Nút giỏ hàng nhanh | Chỉ mở bộ chọn sau khi bấm, đúng sản phẩm, đóng được | PASS Jest trên workspace |
| CART-02 | Mua ngay, chọn món, nhiều shop | Mua ngay giữ giỏ cũ; chỉ mua món đã chọn; tổng tiền tách theo shop | PASS trước đó, báo cáo dịch vụ độc lập |
| PROMO-01 | Báo giá, catalog khuyến mãi và ví voucher | JSON đúng cấu trúc; ví yêu cầu đăng nhập | PASS Newman local; tính tiền và cache theo request được kiểm tra trong unit test |
| STOCK-01 | Tranh kho và phát lại | 40 yêu cầu tranh 10 món; đúng 10 thành công, giữ/hoàn kho không nhân đôi | PASS trước đó, báo cáo dịch vụ độc lập |
| ORDER-01 | Đặt, xác nhận, gửi, nhận | Chủ shop xử lý đúng trạng thái; shop khác bị từ chối | PASS trước đó, báo cáo dịch vụ độc lập |
| ORDER-02 | Trả hàng và ghi nhận hoàn tiền | Chặn sai quyền, hoàn trước khi nhận hàng trả, hoàn trùng | PASS unit test local; luồng COD đầy đủ đã PASS trước đó |
| PAY-01 | Thu tiền và hoàn tiền qua ngân hàng | Kiểm chữ ký, đối soát, chống callback lặp | Chưa chạy; cần cổng thanh toán sandbox hoặc merchant |
| CHAT-01 | Chat, thông báo và WebSocket | Kiểm quyền, chống tin nhắn lặp, nhận sự kiện sau commit | PASS trước đó, báo cáo dịch vụ độc lập |
| SEC-01 | Origin, RBAC, IDOR và audit | Chặn nguồn lạ và dữ liệu sai chủ sở hữu; audit chỉ ghi thêm | PASS CORS qua Newman; các ca còn lại PASS trước đó trong báo cáo bảo mật |
| OPS-01 | Kafka gián đoạn và mất một Product replica | Outbox phục hồi, sự kiện không gây hiệu ứng lặp, API vẫn phản hồi | PASS trước đó, báo cáo dịch vụ độc lập |
| OPS-02 | HTTPS, monitoring và CD | Health/API công khai, thu metric và kiểm tra sau triển khai | PASS trước đó, tài liệu CD |
| PERF-01 | k6 trước/sau Redis | 600 request mỗi lượt, khoảng 20 req/s, so sánh p95 và lỗi | PASS trước đó; p95 143,71 → 36,63 ms, lỗi 0% cả hai lượt |
| MOBILE-01 | Batch báo giá | Gộp ID trùng, tách tài khoản, một batch lỗi không làm kẹt batch khác | PASS 3/3 Node local |
| MOBILE-02 | Expo Go/APK và thiết bị thật | Điều hướng, hệ thống quyền, OAuth callback và mua hàng chạy trên thiết bị | APK từng cài thử; chưa chạy lại trên thiết bị trong lượt này |

## Cách chạy lại

- Backend dùng Maven verify cho auth-service, product-service, order-service, payment-service và api-gateway. Lượt này có 63 test JUnit (gồm 2 MockMvc), 0 lỗi. Payment và Gateway đã build, hiện chưa có bộ unit test riêng.
- Mobile chạy trong apps/mobile: npm ci, npx tsc --noEmit, npm run lint, node --test tests/*.test.mjs và npm test. CI đã được cấu hình chạy Jest cùng các bước cũ. Kết quả lượt local là 1 Jest, 3 Node, typecheck qua, lint 0 lỗi và 81 cảnh báo.
- Import [E-Shop API smoke tests](eshop-smoke.postman_collection.json) vào Postman. Đặt baseUrl là http://localhost:8080 rồi chạy cả collection theo thứ tự. Có thể chạy bằng npx --yes newman@6.2.2 run docs/eshop-smoke.postman_collection.json. Kết quả local là 13 request và 22 assertion, 0 lỗi. Các request chỉ đọc catalog, báo giá hoặc kiểm tra quyền; cần DB đã có sản phẩm.
- Ca tạo đơn và gây lỗi hạ tầng dùng môi trường QA cô lập. Không dùng số đo k6 đã lưu để kết luận hiệu năng của code tối ưu đang làm.

Báo cáo gốc: [dịch vụ và k6](reports/INDEPENDENT_SERVICES_VALIDATION.md), [bảo mật](SECURITY_VERIFICATION.md), [trả hàng](INBOX_RETURNS_PAYMENTS.md), [CD](CONTINUOUS_DEPLOYMENT.md).
