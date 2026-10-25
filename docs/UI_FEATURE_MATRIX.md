# UI Feature Matrix

Comparison between standard Shopee features and our E-commerce app capabilities based on verified Backend APIs.

| Tính năng | Shopee có | API của mình có | Quyết định (Làm / Bỏ qua / Thêm riêng) | Màn hình |
|---|---|---|---|---|
| **Trang chủ (Home)** | | | | |
| Tìm kiếm dạng viên thuốc | Có | Có (`/api/v1/products/search`) | Làm | Home |
| Giỏ hàng + Badge số lượng | Có | Có (`/api/v1/cart`) | Làm (Giỏ hàng vào từ icon ở header) | Home |
| Banner Hero Carousel | Có | Không có API Banner riêng | Tạo banner động lấy SP từ `GET /api/v1/products?sort=discountPercent,desc&size=1`. Hiện tên, % giảm tự tính, ảnh/ảnh thay thế, nút 'Shop now'. Bỏ chữ cố định 'Mega Sale!'. | Home |
| Lưới danh mục (Category Grid) | Có | Có (`/api/v1/categories`) | Render icon Ionicons riêng theo slug (`electronics`, `fashion`, `beauty`, `fresh-fruits`, mặc định `grid-outline`), tên tối đa 2 dòng, ô ~76px. | Home |
| Flash Sale countdown | Có | Không | Bỏ qua | - |
| Best Sales / Popular | Có | Có (`/best-sales`, `/popular`) | Làm (hiện đủ tên, giá, sao, đã bán; skeleton khi tải) | Home |
| Shopee Coins / Vòng quay | Có | Không | Bỏ qua | - |
| Recommended for you | Có | Có (`/api/v1/products`) | Làm (infinite scroll) | Home |
| **Danh sách sản phẩm / Tìm kiếm** | | | | |
| Thanh sắp xếp | Có | Có (tham số theo entity) | Dùng bảng hằng `SORT_OPTIONS` (`minPrice,asc`, `minPrice,desc`, `soldCount,desc`, `viewCount,desc`, `ratingAvg,desc`). Không gửi `price`. | Search/Category |
| Bộ lọc chi tiết | Có | Chỉ có khoảng giá (`minPrice`, `maxPrice`) | Chỉ lọc khoảng giá. GỠ BỎ mọi cờ lọc/nhãn chính sách (Free Return, Buyer Protection, Best Deal) vì API không có. | Filter |
| **Chi tiết sản phẩm** | | | | |
| Nhãn chính sách (Free return...) | Có | Không có sẵn trong API | GỠ BỎ hoàn toàn các nhãn chính sách và thông tin shop. | Product Detail |
| Biểu đồ Đánh giá | Có | Không có biểu đồ phân bố sao | Bỏ biểu đồ phân bố 5->1 sao; hiển thị 3 review mới nhất kèm nút "See all". | Product Detail |
| Upload ảnh Feedback | Có | Không có API Upload | Ẩn phần tải ảnh | Feedback |
| **Giỏ hàng & Đặt hàng** | | | | |
| Nhóm theo Shop | Có | Không có thông tin Shop trong CartResponse | Bỏ nhóm. Giỏ hàng hiện thành DANH SÁCH PHẲNG. Bỏ chip "Authorized shop". | Cart |
| Áp dụng Voucher | Có | Có (`voucherCode`) | Cho nhập mã, không hiện số giảm trước khi đặt. Hiện giảm giá từ `OrderResponse` ở màn Success. | Checkout |
| Thanh toán (Payment) | Có | Enum (`VISA`, `MAESTRO`, `PAYPAL`) | Chỉ hiện phương thức backend nhận. Bỏ "Add new card". | Payment |
| **Tài khoản & Đơn hàng** | | | | |
| Thanh Tab | Có | - | Chỉ 4 tab: Home, Search, Orders, Account. ẨN Favorites và Inbox. Tab Showcase chỉ hiện khi __DEV__. Chiều cao ~64px + safe area. | - |
| Đơn hàng của tôi | Có | Có (`GET /orders`) | Tải `size=50`, lọc trạng thái PENDING_PAYMENT, PAID, SHIPPING... ở local. | Orders |

## Backend Gaps (Thiếu sót API so với thiết kế UI)
1. **Banner API**: Không có API quản lý banner (Dùng sản phẩm có `discountPercent` cao nhất qua `GET /products?sort=discountPercent,desc&size=1`).
2. **Shop Grouping**: Giỏ hàng và sản phẩm không có dữ liệu `shopId` hoặc `shopName`.
3. **Voucher API**: Không có API lấy danh sách voucher (User phải tự nhập mã `voucherCode` khi tạo đơn, không preview được số tiền giảm trước).
4. **Upload Image**: Không có endpoint upload ảnh cho review / avatar.
5. **Sort Property Validation**: Sort sai tên trường (ví dụ `sort=price` hay `sort=rating`) trả HTTP 500 (`INTERNAL_ERROR`) thay vì HTTP 400 (`BAD_REQUEST`). Entity field mapping là `minPrice`, `ratingAvg`.
6. **Product List Missing Fields**: Danh sách `/products` thiếu `images`, `categoryId`, `discountPercent`.
7. **Policy Flags Missing**: API hoàn toàn không có các cờ chính sách như `hasFreeReturn30d`, `hasBuyerProtection`, `bestDeal`.
8. **Static Image Path**: Server trả đường dẫn tương đối `/images/products/...` trỏ tới file không tồn tại (404), frontend cần cơ chế ảnh thay thế pastel + icon.

