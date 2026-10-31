# Catalog và tài khoản shop cho bài trình diễn

Đây là môi trường lớp học, không phải sàn đang kinh doanh. Các tài khoản mang tên hãng là tài khoản đóng vai shop trong bài; chúng không chứng minh quan hệ đối tác với hãng. Daily Mart và các tài khoản cũ được giữ nguyên. Giao diện không gắn nhãn lên từng bản ghi theo yêu cầu trình diễn của chủ dự án.

## Nguồn sản phẩm

`data/brand-catalog-sources.json` định nghĩa 25 danh mục lớn, 10 liên kết thương hiệu mỗi danh mục. Một thương hiệu có thể xuất hiện ở nhiều danh mục và chỉ có một tài khoản shop. `data/curated-brand-catalog.json` lưu tên model, URL nguồn, thời điểm đối chiếu, các thuộc tính đọc được và URL ảnh. Danh sách là lựa chọn từ catalog, không phải bảng xếp hạng doanh số thị trường.

Các nguồn được đọc bằng trang công khai, JSON-LD, feed công khai hoặc danh sách model chính thức. Không vượt trang đăng nhập hay cơ chế chặn truy cập. Trang tin tức, trang giới thiệu và model chưa xác minh không được dùng để bù số lượng. Báo cáo còn thiếu được xuất ở `.tools/brand-catalog-missing.json`; số lượng hoàn thành thực tế ở `.tools/brand-catalog-verification.json`.

Giá VND từ nguồn được giữ theo thời điểm thu thập. Giá ngoại tệ dùng tỷ giá cố định phục vụ bài trình diễn, không phải tỷ giá trực tiếp. Sản phẩm chưa đọc được giá dùng cấu hình giá lớp học. Thuộc tính `priceBasis` phân biệt `SOURCE_VND`, `CLASSROOM_FIXED_FX`, `CLASSROOM_CONFIGURED`; không coi hai loại sau là báo giá của hãng. Mô tả được viết lại từ các thuộc tính xác minh được và hướng dẫn kiểm tra chung; không thêm cấu hình kỹ thuật chưa xác minh. Không tạo giảm giá giả từ một giá gốc tự nâng lên.

Ảnh đọc được là ảnh sản phẩm từ catalog, chưa phải ảnh khách chụp. Mẫu chưa đủ ba ảnh được liệt kê theo Product ID và link nguồn trong `.tools/CATALOG_IMAGES_NEEDED.csv`, để chủ dự án bổ sung đúng sản phẩm. Không dùng ảnh AI giả làm ảnh hàng thật hay ảnh đánh giá.

## Đăng nhập và thực hành

Email: `shop.<brand-key>@eshop.example`, ví dụ `shop.apple@eshop.example`, `shop.samsung@eshop.example`, `shop.lenovo@eshop.example`. Mật khẩu chung được tạo một lần và lưu ở `.tools/shop-catalog-credentials.json`; danh sách dễ mở bằng Excel ở `.tools/shop-catalog-accounts.csv`. Các file mật khẩu bị Git bỏ qua; không đưa chúng vào commit.

Tài khoản `buyer.catalog.practice@eshop.example` dùng chung mật khẩu với bộ shop. `.tools/catalog-practice-flow.json` ghi shop, sản phẩm, một đơn đã kiểm tra đủ luồng và một đơn COD đang chờ shop xác nhận. Đăng nhập Apple → Tài khoản → Quản lý shop → Đơn bán để thao tác; tab Đơn hàng thông thường chỉ hiện đơn tài khoản đó mua.

## Lịch sử trong database

160 tài khoản người mua của bộ lớp học được dùng để tạo đơn, chi tiết đơn, giao hàng, thanh toán và đánh giá trong các bảng nghiệp vụ. Đây là lịch sử được dựng cho bài trình diễn, không phải giao dịch bên ngoài. Đánh giá gắn đúng tài khoản, order ID, order item ID, SKU và chỉ xuất hiện sau giao hàng. Số lượng đánh giá phân bố từ không có đến hơn 100; lượt bán và số sao được tính từ bản ghi, không gán trực tiếp để hiển thị. Không sao chép nhận xét bên ngoài thành nhận xét của người dùng trong app.

## Công cụ

1. Sao lưu bốn schema trước khi thay dữ liệu. Bản sao lưu trước đợt này ở `.tools/before-brand-catalog-20261101.sql`.
2. `node scripts/create-brand-shops.mjs --classroom-local`: tạo tài khoản/shop, chạy lại không nhân bản.
3. `python scripts/prepare-brand-manifest.py`: lọc nguồn, chọn cân đối nhóm sản phẩm và xuất phần còn thiếu.
4. `node scripts/import-brand-products.mjs --classroom-local`: nhập bản ghi theo khóa nguồn, phân loại danh mục con; ẩn trang nguồn bị loại, bảo toàn lịch sử.
5. `node scripts/seed-brand-history.mjs --classroom-local`: bổ sung lịch sử cho sản phẩm chưa xử lý. Mỗi sản phẩm và dấu hoàn thành nằm trong cùng transaction, có thể tiếp tục sau gián đoạn.
6. `node scripts/verify-brand-catalog.mjs`: kiểm tra quyền sở hữu, nguồn, tiền, thời gian, đánh giá, tồn kho và các số tổng hợp; xuất báo cáo và danh sách ảnh thiếu.
7. `node scripts/verify-brand-shop-flow.mjs`: kiểm tra API tạo đơn COD, quyền shop, phân trang, xác nhận, giao, nhận và đánh giá; để thêm một đơn chờ thực hành. Chạy lại sẽ tạo thêm đơn kiểm tra.

Các bộ thu thập Python cần BeautifulSoup. Cache thô nằm trong `.tools/brand-catalog-cache`, không phải dữ liệu hiển thị trực tiếp. Sau khi nhập, đồng bộ Elasticsearch qua `POST /api/v1/products/sync-elasticsearch`.
