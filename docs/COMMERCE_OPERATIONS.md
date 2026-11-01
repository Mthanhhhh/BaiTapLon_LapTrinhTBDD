# Shop, quản trị sàn và đối soát tiền

## Màn hình

- Tài khoản → Trung tâm quản trị sàn (`/admin`): tổng quan; khóa/mở tài khoản; duyệt/tạm ngưng shop; kiểm duyệt sản phẩm/đánh giá; tra cứu chi tiết đơn; thuế/phí; nhật ký; thông báo.
- Kênh người bán → Doanh thu, thuế, phí & đánh giá (`/seller/analytics`): báo cáo 7/30/90/365 ngày, phản hồi đánh giá, xử lý trả hàng.
- Voucher & Flash sale (`/seller/promotions`): ngân sách, quota, hạn dùng, mức giảm, trần giảm, đơn tối thiểu, cộng dồn, giới hạn mỗi khách và nhóm khách.
- Mật khẩu admin được tạo ngẫu nhiên trong `.tools/admin-accounts.json` tại máy chủ; không đưa file này lên Git. Hai tài khoản: `admin.operations@eshop.example`, `admin.finance@eshop.example`.

## Quy ước tiền

Giá hàng mới **đã gồm thuế**. Thuế và phí sàn mặc định chưa cấu hình (0); quản trị nhập mức áp dụng cho từng shop. Không suy đoán nghĩa vụ thuế của thương hiệu.

1. Giá hàng = tổng đơn giá sau flash sale × số lượng.
2. Tiền khách trả = giá hàng − mã shop − mã sàn + vận chuyển − mã vận chuyển. VAT không cộng lần thứ hai.
3. Doanh thu hàng hóa của shop = giá hàng − mã shop. Mã sàn được sàn bù, không trừ thêm vào doanh thu shop.
4. VAT trong giá = làm tròn VNĐ(doanh thu × tỷ lệ VAT / (100 + tỷ lệ VAT)).
5. Phí sàn = làm tròn VNĐ(doanh thu × tỷ lệ phí / 100).
6. Shop được nhận = doanh thu − phí sàn. Đây là khoản phải trả, **không phải chứng nhận đã chuyển ngân hàng**. VAT phải kê khai hiển thị riêng, không tự coi là khoản sàn đã nộp hộ.
7. Phí vận chuyển được theo dõi riêng; không cộng vào doanh thu hàng hóa.

`commerce_order_finance` chốt số tiền và tỷ lệ tại lúc đặt. Đổi chính sách không sửa đơn cũ. Chỉ đơn `DELIVERED` ghi nhận doanh thu; đơn hủy/đang xử lý/trả hàng hiển thị riêng. Trả hàng chờ xử lý tạm loại khỏi khoản shop nhận. Hoàn tiền chỉ ghi nhận sau chứng từ xác nhận của admin; thao tác không tự gọi ngân hàng/cổng thanh toán.

Đơn cũ giữ nguyên tiền đã chốt; thuế từng cộng thêm được hiển thị riêng. Không áp tỷ lệ hiện tại ngược lịch sử. Đơn tiền tệ khác VNĐ không được cộng vào báo cáo VNĐ. Báo cáo theo **ngày đặt đơn**, trong cửa sổ ngày đã chọn, và lấy trạng thái hiện tại.

## Voucher cá nhân

- `ALL`: mọi khách.
- `NEW_BUYER`: chưa có đơn đã giao hoặc đã yêu cầu trả trên sàn.
- `RETURNING`: đã có đơn đã giao hoặc đã yêu cầu trả. Trả hàng không biến tài khoản thành khách mới trở lại.
- `SELECTED`: chỉ ID tài khoản được chỉ định.

Catalog, lưu voucher và checkout đều kiểm tra đối tượng tại server. Ví voucher, lượt dùng và nhắc giờ gắn với ID đăng nhập. Khách có thể lưu mã; lưu không giữ quota. Quota/ngân sách được giữ/chốt trong cùng giao dịch với tồn kho và đơn hàng. Mã shop/sàn/vận chuyển tối đa một mã mỗi lớp; tự chọn tổ hợp có tổng tiền thấp nhất thỏa điều kiện.

Đã phát hành trong database: `ESHOP5`, `CHAO30`, `QUAYLAI20`, `RIENG15`, `FREESHIP30`, `APPLE50` và một phiên flash sale của shop Apple. Thời gian/ngân sách/quota thực tế xem trên giao diện; hết hạn không tự tạo số đếm giả. `RIENG15` ban đầu chỉ cấp cho tài khoản thực hành `buyer.catalog.practice@eshop.example`.

## Trả hàng và chỉnh sửa sản phẩm

Khách yêu cầu trả toàn đơn sau khi nhận → shop chấp nhận/từ chối → nhận lại hàng → admin ghi nhận chứng từ hoàn tiền đúng tổng đơn. Tồn kho chỉ hoàn lại một lần khi shop nhận hàng. Chứng từ hoàn tiền có mã duy nhất. Chưa tích hợp chuyển tiền tự động tới ngân hàng hoặc book vận chuyển bên thứ ba.

Chỉnh sửa phân loại giữ nguyên SKU, lượt bán và liên kết đơn cũ. Phân loại bỏ đi được lưu trữ mềm. Phiên bản tồn kho cũ bị từ chối khi đã có mua hàng đồng thời. Ảnh bìa bắt buộc khi đăng bán. Sản phẩm bị quản trị khóa bán không được chủ shop tự mở lại.

## Catalog và hình ảnh

Ngày 2026-11-01 đã kiểm tra URL của 1.119 sản phẩm: 874 trả ảnh, 232 thiếu/404/410, 13 chưa xác minh được. Đã loại mềm 232 sản phẩm thiếu ảnh, xóa đánh giá/ảnh đánh giá/thẻ đánh giá và giỏ hàng liên quan; giữ snapshot đơn cũ. 13 sản phẩm chưa xác minh được được tạm ẩn. Không xóa sản phẩm chỉ vì một lần kiểm tra bị chặn truy cập. Lịch sử demo trước đây được giữ theo yêu cầu; giao diện và báo cáo không tự sinh lượt bán, đánh giá hay số thống kê.

860 sản phẩm catalog demo có số tiền đã nhập theo VNĐ nhưng mã tiền tệ mặc định USD đã được chuẩn hóa thành VND; không thay đổi giá trị số. Đơn cũ không bị đổi tiền tệ.

10 banner mới nằm trong `apps/mobile/assets/banners/eshop-original-01.png` đến `10.png`; prompt đầy đủ trong `GENERATED_BANNERS.md` cùng thư mục. Công cụ: built-in image_gen. Banner mới không sử dụng ảnh tham khảo của người dùng. Danh mục chuyển sang tìm kiếm; khung trang chủ thay bằng flash sale từ API; tiêu đề sản phẩm giới hạn hai dòng.

## Nâng cấp database đã tồn tại

Sao lưu trước. Chạy `infra/mysql/init/13_commerce_operations.sql`, sau đó `scripts/backfill-commerce-finance.sql`. Hai script thêm bảng/capture đơn cũ, không reset database; backfill không ghi đè snapshot đã có. MySQL init chỉ tự chạy khi tạo volume mới nên máy chủ cũ phải áp dụng script một lần. Không chạy lại `06_seed_data.sql` để nâng cấp.

Máy chủ hiện tại đã áp dụng. Bản sao lưu riêng: `.tools/before-commerce-operations-20261101.sql`. Chi tiết kiểm thử riêng tại `.tools/commerce-verification.json`, kiểm tra ảnh tại `.tools/catalog-image-audit.json`; các file này không đưa lên Git.
