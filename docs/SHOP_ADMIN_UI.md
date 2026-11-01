# Shop, admin và đề xuất trang chủ

## Giao diện và điều hướng

App dùng safe-area theo thiết bị ở cạnh trên/trái/phải, cộng thêm 4px phía trên trên native. Không lấy chiều cao status bar cố định. Nút hành động dùng một dòng và co chữ trong giới hạn khi màn hình hẹp; nút chi tiết sản phẩm giảm padding ngang. Chưa build APK mới trong lượt sửa này.

Admin được nhận diện từ vai trò server `ADMIN`/`ROLE_ADMIN`. Navigator admin chỉ đăng ký khu quản trị và quản lý chiến dịch; không đăng ký trang chủ khách, giỏ hàng, thanh toán hay đơn mua. Đăng nhập bằng form chuyển sang navigator theo vai trò thực; deep-link trang mua không mở giao diện khách khi đã đăng nhập admin. Admin có khung riêng tối đa 1120px trên web, không nền sóng hoặc tab mua sắm; hook giỏ không chạy cho admin. Chủ shop vẫn có thể dùng giao diện khách.

Đã bỏ dòng “Giá shop” trên thẻ. Banner giữ kích thước gọn và ảnh minh họa hiện có, thêm các trường màu xanh/đỏ/tím/vàng, chữ đậm nghiêng và CTA rõ. Không ghi thêm tỷ lệ giảm hay miễn phí vận chuyển không có dữ liệu. Danh mục lớn giữ atlas clay, dùng bounds riêng từng hình để tránh lẫn hình bên cạnh; 150 danh mục con có ký hiệu riêng ổn định trong `subcategoryIcons.ts`.

## Hồ sơ và quản lý shop

`/seller/setup` gồm 3 bước: nhận diện cửa hàng; liên hệ/địa chỉ lấy hàng; kiểm tra và xác nhận. Có logo, ảnh bìa, tên/giới thiệu, loại hình tự khai, mã số thuế tùy chọn, người phụ trách, điện thoại, email, tỉnh/phường theo dữ liệu mới, số nhà/đường, địa chỉ trả, giờ hỗ trợ và thời gian chuẩn bị hàng. Ảnh được tải lên Cloudinary. Hồ sơ liên hệ lưu riêng trong `product_db.shop_business_profiles`; chỉ chủ shop và admin xem được, không đưa email/điện thoại vào API shop công khai. Loại hình/mã thuế là thông tin tự khai, không phải xác minh pháp lý.

Backend thêm migration `infra/mysql/init/15_shop_profiles.sql`, đã áp dụng trên server hiện tại. Tạo shop thiếu thông tin bị từ chối; tạo lại trả shop hiện có; admin không mở shop bằng tài khoản quản trị. Giao dịch tạo shop/hồ sơ/ảnh được rollback khi kiểm tra không hợp lệ. API sửa profile kiểm tra quyền chủ shop.

Kênh người bán có Tổng quan, Sản phẩm, Danh mục shop và Hồ sơ. Tổng quan có doanh thu, tiền được nhận, lối vào xử lý đơn/chat/voucher, đường doanh thu, cơ cấu trạng thái và ảnh sản phẩm bán được. Sản phẩm có tìm theo tên, ảnh/tồn/giá/trạng thái, mở trình soạn khi thêm/sửa, giảm giá và ẩn/hiện. Danh mục riêng hỗ trợ đặt tên, gán sản phẩm, đổi thứ tự và xóa nhóm; lưu qua API collections hiện có.

## Quản trị và báo cáo

Giữ các thao tác tài khoản, shop, sản phẩm, đơn, đánh giá, voucher, thông báo và nhật ký. Bổ sung lọc trạng thái, tổng kết quả/pagination đúng theo bộ lọc, hồ sơ riêng từng đối tượng, ảnh shop/sản phẩm/đánh giá. Thao tác kiểm duyệt và cấu hình phí vẫn yêu cầu lý do, có audit và kiểm tra quyền ở server.

Biểu đồ và số tiền lấy từ report backend, không hardcode. Số đếm trạng thái đối chiếu với tổng đơn; phần khác được thể hiện nếu có. Đường doanh thu dùng ngày trong kỳ và mốc thời gian từ server WebSocket; ngày không có đơn được hiển thị 0. Top sản phẩm dùng ảnh catalog và line items. Các mức thuế/phí lấy cấu hình đã chốt theo đơn; tiền được nhận chưa đồng nghĩa đã chuyển ngân hàng. Lịch sử demo trước đây được giữ theo yêu cầu.

## AI đề xuất

`POST /api/v1/ai/recommendations` nhận tối đa 5 từ khóa gần nhất, sessionId, page, size. Lịch sử tìm kiếm phía app được tách theo tài khoản. Backend chọn tối đa 50 ứng viên theo độ liên quan, danh mục và chất lượng từ catalog; Gemini sắp xếp tối đa 16 ID, phần còn lại vẫn giữ trong toàn catalog. AI không tạo giá/sản phẩm/đánh giá. Chỉ ID nguyên, tồn tại trong danh sách ứng viên và không trùng được chấp nhận.

Cache ý định 20 phút, giới hạn tần suất gọi AI, snapshot thứ tự theo phiên/tài khoản để các trang tiếp theo không đổi thứ tự do AI. Thay từ khóa cần session mới. Gemini dùng mức suy luận tối thiểu và timeout 10 giây; nếu lỗi/timeout thì dùng xếp hạng catalog sẵn có. Chỉ từ khóa và metadata catalog công khai gửi lên Gemini; không gửi email, địa chỉ hay đơn riêng của khách. API key nằm ở server.

## Kiểm tra

- 5 test product-service: lọc ID AI không hợp lệ/trùng/không nguyên, giới hạn kết quả, cố định thứ tự theo phiên, không gọi AI khi chưa có tìm kiếm.
- 13 test order-service về pricing, finance và checkout tiếp tục qua.
- API: tạo/sửa hồ sơ, thiếu thông tin, quyền chủ shop, chặn admin mở shop, lọc/tổng kết quả admin, hồ sơ riêng, đối soát số đếm biểu đồ, toàn catalog và phân trang đề xuất.
- Gemini thực tế trả `aiPowered=true`, khoảng 3 giây trong lần kiểm tra; API đề xuất qua HTTPS công khai trả đủ catalog.
- Browser: luồng mở shop qua đủ ba bước và lưu database; đăng nhập admin bằng form; tách giao diện khi mở deep-link mua; dashboard, sản phẩm/danh mục shop, banner và nút chi tiết ở 320/390/768/1440px.
- TypeScript và lint không có lỗi; lint còn các cảnh báo hiện tại của project. Bản APK cũ không chứa thay đổi giao diện mới này.

Các báo cáo riêng nằm trong `.tools/shop-admin-verification.json`, `.tools/home-ai-live.json`, `.tools/shop-admin-entry-final.txt`, `.tools/shop-admin-browser.txt`. Sao lưu shop trước migration: `.tools/shops-before-profile-20261102.sql`.
