# E-Commerce Marketplace

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
# Tính năng trợ lý AI (tùy chọn)

Product service cung cấp tìm kiếm theo ý nghĩa danh mục và API chat tư vấn sản phẩm. Tìm kiếm vẫn hoạt động khi chưa có khóa AI; ví dụ “điện thoại” sẽ tìm các sản phẩm thuộc danh mục Smartphones. Để bật câu trả lời tạo bởi AI, đặt `OPENAI_API_KEY` trong môi trường chạy `product-service`. Khóa chỉ ở backend, không đưa vào ứng dụng mobile. Có thể chọn model bằng `OPENAI_MODEL`; nếu chưa có khóa hoặc dịch vụ AI tạm thời không dùng được, chat sẽ gợi ý dựa trên sản phẩm trong catalog.

Trên PowerShell, đặt biến môi trường trước khi chạy backend:

```powershell
$env:OPENAI_API_KEY = "your-api-key"
$env:OPENAI_MODEL = "gpt-6-astra"
```
