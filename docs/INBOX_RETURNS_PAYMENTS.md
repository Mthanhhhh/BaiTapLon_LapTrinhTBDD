# Trang chủ, hộp thư và trả hàng

- Giữ bảng màu, banner, hai cột sản phẩm; thống nhất lề ngoài 10px, khoảng cột/thẻ 8px và khoảng các nhóm 10px. Không hiện nhãn “Giá shop” khi chưa có báo giá voucher.
- Giỏ hàng vẫn cạnh tìm kiếm. Tin nhắn có lối vào riêng ở thông báo, tài khoản, đơn mua và trang shop; không có nút tin nhắn trên trang chủ, badge lấy số chưa đọc từ server.
- Thông báo dùng icon phân biệt đơn hàng/ưu đãi/hệ thống theo yêu cầu sửa cuối cùng; ảnh đơn mua là ảnh snapshot sản phẩm. Có bộ lọc server, phân trang, trạng thái đọc, modal nội dung và trạng thái đơn hiện tại. Tin CHAT không còn lẫn trong danh sách hoặc tổng chưa đọc thông báo; đọc tất cả không đọc hộ tin nhắn.
- Hộp thư tìm theo người đối thoại, avatar từ profile/logo khi có, nhãn khách/shop. Chat phân biệt trái/phải theo ID số, ghi người gửi/ngày/giờ, tải lịch sử, gửi lại với khóa chống trùng; vẫn dùng WebSocket hiện có, polling dự phòng. Không hiển thị trạng thái online/đã xem chưa được đo.
- Khách nhập lý do trả toàn đơn (10–1.500 ký tự), xem tiến độ REQUESTED → APPROVED → RECEIVED → REFUNDED và chứng từ hoàn tiền. REJECTED hướng dẫn trao đổi với shop, không tạo yêu cầu trùng. Shop chỉ hoàn kho một lần khi xác nhận nhận lại. Admin chỉ ghi nhận hoàn đúng tổng đơn đã thanh toán, hàng đã nhận lại và chưa có chứng từ. Không tự chuyển tiền thật.
- Bỏ PayPal/Maestro khỏi lựa chọn đặt đơn mới. COD hoạt động; Visa/thẻ nội địa chưa kết nối được vô hiệu hóa, nêu rõ lý do. Backend payment từ chối giao dịch thay vì giả lập thành công dựa vào số thẻ. UI không thu số thẻ/CVV. Đơn online cũ được giữ nguyên để tra cứu/hủy.

## Tích hợp ngân hàng tiếp theo

Tài khoản ngân hàng nhận tiền thông thường không cấp quyền ghi nợ tài khoản khách. Tích hợp thu tiền cần tài khoản merchant/API của ngân hàng hoặc cổng thanh toán, khách xác thực, backend kiểm chữ ký và số tiền trên callback/IPN rồi mới chuyển đơn sang đã thanh toán. Return URL một mình không là bằng chứng thu tiền. Chuyển khoản nhận tiền/đối soát là luồng khác với tự động ghi nợ.

Nguồn chính thức: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html và https://sandbox.vnpayment.vn/apis/docs/thanh-toan-token/token.html . Chưa đăng ký merchant, chưa nhập khóa và chưa bật thu tiền thật trong lượt sửa này.

## Kiểm tra

TypeScript qua; lint 0 lỗi, còn cảnh báo của dự án. Bốn unit test mới bảo vệ lý do, quyền mua, trạng thái giao và chống yêu cầu trùng; các test backend hiện có qua khi package. API kiểm thử đơn 55502: COD → xác nhận → gửi → nhận → yêu cầu trả → đồng ý → nhận lại → ghi nhận hoàn tiền; chặn sai quyền, lý do ngắn, nhận hàng trả lặp, hoàn tiền sớm/lặp. Tồn kho SKU trở về trước đơn kiểm thử. Chat hai tài khoản, metadata đối thoại và lọc thông báo được kiểm tra qua API. Báo cáo riêng trong `.tools/inbox-polish-api.json`.

Trình duyệt kiểm tra 320/390/768px: trang chủ/thông báo/hộp thư không tràn ngang; ảnh 3D đã bỏ khỏi thông báo, chat có đủ hai bên. Ảnh chụp và script kiểm tra giữ riêng trong `.tools/`. Không build APK trong lượt này.

Ảnh minh họa dùng trong chat và trang thanh toán: `apps/mobile/assets/illustrations/inbox-parcel.png`, tạo bằng imagegen tích hợp, prompt: “3D clay lavender parcel box with mint ribbon, rounded delivery van and peach envelope, pastel shopping app, soft studio light, pale background, no lettering or flat vector icons.” Không phải ảnh sản phẩm hoặc bằng chứng giao dịch.
