# API Inventory

This document lists all the verified endpoints from the backend `ecommerce-service`. 

## 1. Authentication & User Profile (`/api/v1/auth`, `/api/v1/addresses`)

| Method | Endpoint | Token Required? | Request Body | Response (data) | Description |
|---|---|---|---|---|---|
| POST | `/api/v1/auth/register` | No | `{ email, password, fullName, phone? }` | `AuthResponse { accessToken, refreshToken, expiresIn }` | Register new user |
| POST | `/api/v1/auth/login` | No | `{ email, password }` | `AuthResponse` | User login |
| POST | `/api/v1/auth/refresh` | No | `{ refreshToken }` | `AuthResponse` | Refresh token |
| GET | `/api/v1/auth/me` | Yes | - | `UserProfileResponse` | Get current user profile |
| PUT | `/api/v1/auth/me` | Yes | `{ fullName, phone, avatarUrl }` | `UserProfileResponse` | Update profile |
| GET | `/api/v1/addresses` | Yes | - | `List<AddressResponse>` | Get user addresses |
| POST | `/api/v1/addresses` | Yes | `AddressRequest` | `AddressResponse` | Add new address |
| PUT | `/api/v1/addresses/{id}` | Yes | `AddressRequest` | `AddressResponse` | Update address |
| DELETE | `/api/v1/addresses/{id}` | Yes | - | `Void` | Delete address |
| PATCH | `/api/v1/addresses/{id}/default` | Yes | - | `AddressResponse` | Set as default address |

## 2. Categories (`/api/v1/categories`)

| Method | Endpoint | Token Required? | Request Body / Params | Response (data) | Description |
|---|---|---|---|---|---|
| GET | `/api/v1/categories` | No | - | `List<CategoryResponse>` | Get root categories |
| GET | `/api/v1/categories/{id}` | No | - | `CategoryResponse` | Get category details |
| GET | `/api/v1/categories/{id}/subcategories` | No | - | `List<CategoryResponse>` | Get subcategories |

*(Admin endpoints for Create/Update/Delete category are excluded from this inventory as they are not used in the consumer app).*

## 3. Products (`/api/v1/products`)

| Method | Endpoint | Token Required? | Query Params | Response (data) | Description |
|---|---|---|---|---|---|
| GET | `/api/v1/products` | No | `page`, `size`, `sort` | `PageResponse<ProductListResponse>` | Get paginated products |
| GET | `/api/v1/products/search` | No | `keyword`, `minPrice`, `maxPrice`, `page`, `size`, `sort` | `PageResponse<ProductListResponse>` | Search and filter products |
| GET | `/api/v1/products/best-sales` | No | `page`, `size` | `PageResponse<ProductListResponse>` | Best selling products |
| GET | `/api/v1/products/popular` | No | `page`, `size` | `PageResponse<ProductListResponse>` | Popular products |
| GET | `/api/v1/products/category/{categoryId}` | No | `page`, `size`, `sort` | `PageResponse<ProductListResponse>` | Products by category |
| GET | `/api/v1/products/{id}` | No | - | `ProductResponse` | Get product details |

*(Admin endpoints for Create/Update/Delete product are excluded).*

## 4. Product Reviews (`/api/v1/products/{productId}/reviews`)

| Method | Endpoint | Token Required? | Request Body / Params | Response (data) | Description |
|---|---|---|---|---|---|
| GET | `/api/v1/products/{productId}/reviews` | No | `page`, `size` | `PageResponse<ReviewResponse>` | Get reviews for a product |
| POST | `/api/v1/products/{productId}/reviews` | Yes | `{ rating, comment, ... }` | `ReviewResponse` | Submit a review |

## 5. Cart (`/api/v1/cart`)

| Method | Endpoint | Token Required? | Request Body | Response (data) | Description |
|---|---|---|---|---|---|
| GET | `/api/v1/cart` | Yes | - | `CartResponse` | Get current user's cart |
| POST | `/api/v1/cart/items` | Yes | `{ productId, variantId, quantity }` | `CartResponse` | Add item to cart |
| PUT | `/api/v1/cart/items/{itemId}` | Yes | `{ quantity }` | `CartResponse` | Update cart item quantity |
| DELETE | `/api/v1/cart/items/{itemId}` | Yes | - | `CartResponse` | Remove item from cart |
| DELETE | `/api/v1/cart` | Yes | - | `Void` | Clear cart |

## 6. Orders (`/api/v1/orders`)

| Method | Endpoint | Token Required? | Request Body / Params | Response (data) | Description |
|---|---|---|---|---|---|
| POST | `/api/v1/orders` | Yes | `{ addressId, paymentMethod, note, voucherCode }` | `OrderResponse` | Create new order |
| GET | `/api/v1/orders` | Yes | `page`, `size` | `PageResponse<OrderResponse>` | Get user's orders |
| GET | `/api/v1/orders/{id}` | Yes | - | `OrderResponse` | Get order details |
| POST | `/api/v1/orders/{id}/cancel` | Yes | - | `OrderResponse` | Cancel an order |

## 7. Payments (`/api/v1/payments`)

| Method | Endpoint | Token Required? | Request Body | Response (data) | Description |
|---|---|---|---|---|---|
| POST | `/api/v1/payments` | Yes | `PaymentRequest` | `PaymentResponse` | Process payment |
| GET | `/api/v1/payments/order/{orderId}`| Yes | - | `PaymentResponse` | Get payment status by order ID |

## Standard Error Response Format
```json
{
  "timestamp": "2026-10-10T12:00:00Z",
  "status": 400,
  "code": "VALIDATION_FAILED",
  "message": "Validation error",
  "path": "/api/v1/auth/register",
  "errors": {
    "email": "must not be blank"
  }
}
```


## 8. Detailed DTO Specifications (Condition B)

### Base Responses
- **`ApiResponse<T>`**: `{ boolean success, String message, T data }`
- **`PageResponse<T>`**: `{ List<T> content, int page, int size, long totalElements, int totalPages, boolean last }`
- **Pagination Defaults**: Spring Data defaults to `page=0`, `size=20`. Sort accepts `sort=propertyName,asc|desc` (e.g. `sort=discountPercent,desc`). Valid properties include `minPrice`, `ratingAvg`, `soldCount`, `viewCount`, `discountPercent`, `createdAt`.

### Product & Category DTOs
- **`ProductListResponse`**: `{ Long id, String name, BigDecimal price, BigDecimal originalPrice (optional), String thumbnailUrl (nullable), BigDecimal rating, int ratingCount, int soldCount, int stock, String categoryName }`. *(Ghi chú: KHÔNG có `images`, `categoryId`, `discountPercent`).*
- **`ProductResponse`**: `{ Long id, String name, String description, BigDecimal price, BigDecimal originalPrice (optional), Long categoryId, String categoryName, String thumbnailUrl, List<String> images, int stock, BigDecimal rating, int ratingCount, int soldCount, List<ProductVariantResponse> variants, LocalDateTime createdAt, boolean active }`. *(Ghi chú: KHÔNG có rating distribution, KHÔNG có policy flags, KHÔNG có thông tin shop).*
- **`ProductVariantResponse`**: `{ Long id, String name, String sku, BigDecimal price, int stock }`
- **`CategoryResponse`**: `{ Long id, String name, String slug, int displayOrder }`. *(Ghi chú: KHÔNG có `thumbnailUrl`, `description`, `parentId`).*

### Cart DTOs
- **`CartResponse`**: `{ Long id, List<CartItemResponse> items, int totalItems, BigDecimal totalAmount }`. *(Note: shopId, shopName, tax, fees are NOT present. The list is flat).*
- **`CartItemResponse`**: `{ Long id, Long productId, String productName, String productImage, Long variantId, String variantName, BigDecimal price, int quantity, BigDecimal subtotal }`

### Order DTOs & Sequence
- **Sequence**: 
  1. `POST /api/v1/orders` creates order with status `PENDING_PAYMENT`. Returns `OrderResponse`.
  2. `POST /api/v1/payments` processes payment. If successful (mocked logic: card number ending in 0000 fails, others pass), updates order to `PAID`. Returns `PaymentResponse`.
- **`OrderResponse`**: `{ Long id, Long userId, OrderStatus status, List<OrderItemResponse> items, BigDecimal subtotal, BigDecimal discount, BigDecimal tax, BigDecimal fees, BigDecimal total, String voucherCode, String shippingName, String shippingPhone, String shippingStreet, String shippingCity, String shippingCountry, String note, LocalDateTime createdAt, LocalDateTime updatedAt }`
- **`OrderStatus`**: Enum(`PENDING_PAYMENT`, `PAID`, `SHIPPING`, `DELIVERED`, `CANCELLED`, `RETURNED`)

### Payment DTOs
- **`PaymentRequest`**: `{ Long orderId, PaymentMethod method, String cardNumber, String cardHolderName, String cardExpiry, String cardCvv, String paypalEmail }`
- **`PaymentMethod`**: Enum(`VISA`, `MAESTRO`, `PAYPAL`)
- **`PaymentResponse`**: `{ Long id, Long orderId, PaymentMethod method, PaymentStatus status, BigDecimal amount, String cardLastFour, String cardType, String transactionId, LocalDateTime paidAt, LocalDateTime createdAt }`
- **`PaymentStatus`**: Enum(`PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`)

### Review DTOs
- **`ReviewRequest` (POST /reviews)**: `{ Long orderId (Required), Integer rating (Required, 1-5), String comment, String emotion, List<String> tags, List<String> imageUrls }`. *(Note: orderItemId is NOT present in the request body)*.
- **`ReviewResponse`**: `{ Long id, Long productId, Long userId, String userName, String userAvatar, Integer rating, String comment, String emotion, List<String> tags, List<String> imageUrls, LocalDateTime createdAt }`

### Address & User DTOs
- **`AddressRequest` / `AddressResponse`**: `{ Long id, String fullName, String phone, String street, String city, String state, String country, String zipCode, boolean isDefault }`
- **`UserProfileResponse`**: `{ Long id, String email, String fullName, String phone, String avatarUrl, List<RoleEnum> roles, LocalDateTime createdAt }`
