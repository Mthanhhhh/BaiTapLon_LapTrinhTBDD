# Backend Notes: Multi-Datasource & Transaction Management

Tài liệu này ghi chú kiến trúc cấu hình đa nguồn dữ liệu (Multi-Datasource) và quản lý giao dịch (Transaction Manager) trong dịch vụ `ecommerce-service` (`services/ecommerce-service`).

---

## 1. Tổng Quan Kiến Trúc Đa Nguồn Dữ Liệu
Hệ thống sử dụng mô hình cơ sở dữ liệu riêng biệt theo từng domain (Domain-Driven Database Partitioning) trên cùng một máy chủ MySQL, mỗi domain quản lý độc lập DataSource, EntityManagerFactory và PlatformTransactionManager riêng biệt.

Có **4 DataSource độc lập**:
1. **Auth Database (`auth_db`)**: Quản trị tài khoản, quyền (RBAC), token.
2. **Product Database (`product_db`)**: Quản trị danh mục, sản phẩm, biến thể, đánh giá (reviews).
3. **Order Database (`order_db`)**: Quản trị giỏ hàng (cart), đơn hàng (order), chi tiết đơn hàng (order items).
4. **Payment Database (`payment_db`)**: Quản trị thanh toán, lịch sử giao dịch.

---

## 2. Chi Tiết Các Cấu Hình và File Định Nghĩa

### 2.1. Auth Domain
- **File cấu hình**: [`src/main/java/com/team/ecommerce/auth/config/AuthDataSourceConfig.java`](file:///T:/ProjectTBDD/services/ecommerce-service/src/main/java/com/team/ecommerce/auth/config/AuthDataSourceConfig.java)
- **Cấu hình thuộc tính**: `app.datasource.auth`
- **Tên DataSource Bean**: `authDataSource`
- **Tên EntityManagerFactory Bean**: `authEntityManagerFactory` (scan: `com.team.ecommerce.auth.entity`, `com.team.ecommerce.shared.entity`)
- **Tên TransactionManager Bean**: `authTransactionManager` (kiểu `PlatformTransactionManager` / `JpaTransactionManager`)
- **Repository Package**: `com.team.ecommerce.auth.repository`

### 2.2. Product Domain
- **File cấu hình**: [`src/main/java/com/team/ecommerce/product/config/ProductDataSourceConfig.java`](file:///T:/ProjectTBDD/services/ecommerce-service/src/main/java/com/team/ecommerce/product/config/ProductDataSourceConfig.java)
- **Cấu hình thuộc tính**: `app.datasource.product`
- **Tên DataSource Bean**: `productDataSource`
- **Tên EntityManagerFactory Bean**: `productEntityManagerFactory` (scan: `com.team.ecommerce.product.entity`, `com.team.ecommerce.shared.entity`)
- **Tên TransactionManager Bean**: `productTransactionManager` (kiểu `PlatformTransactionManager` / `JpaTransactionManager`)
- **Repository Package**: `com.team.ecommerce.product.repository`
- **Lưu ý**: Tất cả service thuộc domain Product (như [`ProductService`](file:///T:/ProjectTBDD/services/ecommerce-service/src/main/java/com/team/ecommerce/product/service/ProductService.java)) phải khai báo tường minh `@Transactional("productTransactionManager")` hoặc `@Transactional(value = "productTransactionManager", readOnly = true)` để Spring liên kết đúng ngữ cảnh giao dịch của `product_db`.

### 2.3. Order Domain
- **File cấu hình**: [`src/main/java/com/team/ecommerce/order/config/OrderDataSourceConfig.java`](file:///T:/ProjectTBDD/services/ecommerce-service/src/main/java/com/team/ecommerce/order/config/OrderDataSourceConfig.java)
- **Cấu hình thuộc tính**: `app.datasource.order`
- **Tên DataSource Bean**: `orderDataSource`
- **Tên EntityManagerFactory Bean**: `orderEntityManagerFactory` (scan: `com.team.ecommerce.order.entity`, `com.team.ecommerce.shared.entity`)
- **Tên TransactionManager Bean**: `orderTransactionManager` (kiểu `PlatformTransactionManager` / `JpaTransactionManager`)
- **Repository Package**: `com.team.ecommerce.order.repository`

### 2.4. Payment Domain
- **File cấu hình**: [`src/main/java/com/team/ecommerce/payment/config/PaymentDataSourceConfig.java`](file:///T:/ProjectTBDD/services/ecommerce-service/src/main/java/com/team/ecommerce/payment/config/PaymentDataSourceConfig.java)
- **Cấu hình thuộc tính**: `app.datasource.payment`
- **Tên DataSource Bean**: `paymentDataSource`
- **Tên EntityManagerFactory Bean**: `paymentEntityManagerFactory` (scan: `com.team.ecommerce.payment.entity`, `com.team.ecommerce.shared.entity`)
- **Tên TransactionManager Bean**: `paymentTransactionManager` (kiểu `PlatformTransactionManager` / `JpaTransactionManager`)
- **Repository Package**: `com.team.ecommerce.payment.repository`

---

## 3. Tổng Hợp Bảng Tra Cứu

| Domain | File Cấu Hình | DataSource | EntityManagerFactory | TransactionManager |
|---|---|---|---|---|
| **Auth** | `AuthDataSourceConfig.java` | `authDataSource` | `authEntityManagerFactory` | `authTransactionManager` |
| **Product** | `ProductDataSourceConfig.java` | `productDataSource` | `productEntityManagerFactory` | `productTransactionManager` |
| **Order** | `OrderDataSourceConfig.java` | `orderDataSource` | `orderEntityManagerFactory` | `orderTransactionManager` |
| **Payment** | `PaymentDataSourceConfig.java` | `paymentDataSource` | `paymentEntityManagerFactory` | `paymentTransactionManager` |

