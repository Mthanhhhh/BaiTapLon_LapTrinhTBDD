# E-Commerce Marketplace

**Thành viên nhóm:** [Pull code và chạy frontend với server/database chung](docs/TEAM_QUICKSTART.md). API: `https://api-eshop.mtcord.io.vn`.

Voucher/Flash sale mới chạy trên các service tách riêng (gateway, auth, product, order, payment), dùng Redis, Kafka và WebSocket. Xem [hướng dẫn triển khai, sử dụng và kiểm thử](docs/PROMOTIONS.md). Phần quick start monolith bên dưới là hướng dẫn legacy.

Lịch sử tài khoản–đơn hàng–đánh giá phục vụ trình bày đồ án: [bộ dữ liệu lớp học và kiểm chứng](docs/CLASSROOM_DATA.md).

Hệ thống backend cho dự án E-Commerce Marketplace theo kiến trúc modular monolith.

## Tech Stack
- **Ngôn ngữ:** Java 21
- **Framework:** Spring Boot 3.3.5
- **Cơ sở dữ liệu:** MySQL 8.0
- **Migration:** Flyway
- **Bảo mật:** Spring Security + JWT
- **Tài liệu API:** Swagger/OpenAPI 3

## Yêu cầu môi trường (Prerequisites)
- Java 21
- Maven 3.9+
- Docker và Docker Compose

## Hướng dẫn cài đặt nhanh (Quick Start)

1. **Khởi chạy cơ sở dữ liệu với Docker:**
   ```bash
   cd infra
   docker-compose up -d
   ```

2. **Chạy ứng dụng:**
   ```bash
   cd services/ecommerce-service
   mvn spring-boot:run
   ```

## Tài liệu API
Swagger UI: http://localhost:8080/swagger-ui/index.html
OpenAPI Docs: http://localhost:8080/api-docs

## Tài khoản Demo
- Admin: `admin@ecommerce.com` / `admin123`
- Buyer: `buyer@ecommerce.com` / `buyer123`

## Cấu trúc thư mục (Project Structure)
- `src/main/java/com/team/ecommerce`: Chứa source code Java theo layered architecture (controller, service, repository).
- `src/main/resources/db/migration`: Các file migration Flyway cho database.
- `infra/docker-compose.yml`: File cấu hình Docker.
### Catalog shop cho bài trình diễn

Xem [tài khoản shop, nguồn model, dữ liệu lớp học và cách kiểm tra](docs/BRAND_CATALOG.md). Danh sách tài khoản và báo cáo ảnh còn thiếu được xuất vào `.tools/`, không commit mật khẩu.
