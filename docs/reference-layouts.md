# Bố cục theo ảnh tham khảo

Giữ hệ màu pastel và nền chuyển động của E-Shop. Chỉ tham khảo cách phân nhóm và thứ bậc nội dung từ ảnh người dùng cung cấp.

- Home: thanh tìm kiếm và giỏ hàng tròn; hàng tiện ích thật; banner/danh mục nhỏ; hai thẻ sản phẩm đầu còn hiện đủ ở 390×844.
- Tài khoản: hồ sơ nằm ngang, lối tắt đơn mua theo trạng thái và nhóm tiện ích. Badge chỉ hiển thị số thật khi đã tải đủ danh sách đơn; không gán số ảo.
- Thông báo: tiêu đề/giỏ hàng, thẻ cập nhật đơn hàng kèm ảnh từ đơn thực tế, nhóm Đơn hàng/Khuyến mãi/Hệ thống và đánh dấu đã đọc.
- Chi tiết: ảnh lớn, dải thumbnail điều khiển gallery, giá/tên/thống kê, shop và thanh mua cố định.
- Phân loại: popup dưới màn hình có ảnh, giá/giá gốc/tồn kho, vùng phân loại cuộn, giới hạn số lượng và nút xác nhận cố định. Chọn biến thể không hợp lệ không còn rơi về biến thể đầu tiên.

## Kiểm tra

TypeScript, lint các màn hình thay đổi và export web đã chạy. Đã xem ảnh ở điện thoại/tablet/desktop cho trang sản phẩm, và điện thoại cho Home/popup. Chưa kiểm thử trực tiếp các thao tác trong phiên đăng nhập do công cụ điều khiển trình duyệt lỗi khởi tạo; không thay dữ liệu người dùng bằng mock để chụp ảnh.

Popup theo yêu cầu phủ lên trang sản phẩm phía sau. Cảnh báo covered-text của inspector ở giá nền phía sau là che phủ có chủ đích của modal, không phải giá trong popup bị che. Nội dung nền được ẩn khỏi cây accessibility khi modal mở. Khoảng trống desktop ngoài app frame 480px là bố cục mobile hiện có.
