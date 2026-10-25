# API Samples (Verified with curl)

Samples gathered from `http://localhost:8080` on 2026-10-11.

---

## 1. Product Detail: `GET /api/v1/products/10`

### Command
```bash
curl.exe -i http://localhost:8080/api/v1/products/10
```

### Response
```http
HTTP/1.1 200 
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": 10,
    "name": "Red Sneakers",
    "description": "Red Sneakers. Quis occaecat magna elit magna do nisi ipsum amet excepteur tempor nisi exercitation qui.",
    "price": 299.00,
    "originalPrice": 598.00,
    "categoryId": 21,
    "categoryName": "Shoes",
    "thumbnailUrl": "/images/products/red-sneakers-1.jpg",
    "images": [
      "/images/products/red-sneakers-1.jpg"
    ],
    "stock": 100,
    "rating": 4.50,
    "ratingCount": 420,
    "soldCount": 1900,
    "variants": [
      {
        "id": 10,
        "name": "Default",
        "sku": "SKU-00010",
        "price": 299.00,
        "stock": 100
      }
    ],
    "createdAt": "2026-10-06T01:43:54.838",
    "active": true
  }
}
```

---

## 2. Product List (Pagination): `GET /api/v1/products?size=2`

### Command
```bash
curl.exe -i "http://localhost:8080/api/v1/products?size=2"
```

### Response
```http
HTTP/1.1 200 
Content-Type: application/json

{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "name": "Headphone",
        "price": 59.00,
        "thumbnailUrl": "/images/products/headphone-1.jpg",
        "rating": 4.48,
        "ratingCount": 99,
        "soldCount": 1520,
        "stock": 100,
        "categoryName": "Headphones"
      },
      {
        "id": 2,
        "name": "Headphone Gold",
        "price": 99.00,
        "thumbnailUrl": "/images/products/headphone-gold-1.jpg",
        "rating": 4.50,
        "ratingCount": 80,
        "soldCount": 640,
        "stock": 100,
        "categoryName": "Headphones"
      }
    ],
    "page": 0,
    "size": 2,
    "totalElements": 19,
    "totalPages": 10,
    "last": false
  }
}
```

---

## 3. Sort by Discount (Banner Candidate): `GET /api/v1/products?sort=discountPercent,desc&size=1`

### Command
```bash
curl.exe -i "http://localhost:8080/api/v1/products?sort=discountPercent,desc&size=1"
```

### Response
```http
HTTP/1.1 200 
Content-Type: application/json

{
  "success": true,
  "data": {
    "content": [
      {
        "id": 10,
        "name": "Red Sneakers",
        "price": 299.00,
        "originalPrice": 598.00,
        "thumbnailUrl": "/images/products/red-sneakers-1.jpg",
        "rating": 4.50,
        "ratingCount": 420,
        "soldCount": 1900,
        "stock": 100,
        "categoryName": "Shoes"
      }
    ],
    "page": 0,
    "size": 1,
    "totalElements": 19,
    "totalPages": 19,
    "last": false
  }
}
```

---

## 4. Sort by Price Asc: `GET /api/v1/products?sort=minPrice,asc&size=2`

### Command
```bash
curl.exe -i "http://localhost:8080/api/v1/products?sort=minPrice,asc&size=2"
```

### Response
```http
HTTP/1.1 200 
Content-Type: application/json

{
  "success": true,
  "data": {
    "content": [
      {
        "id": 12,
        "name": "Hoodie shirt",
        "price": 2.99,
        "thumbnailUrl": "/images/products/hoodie-shirt-1.jpg",
        "rating": 4.50,
        "ratingCount": 99,
        "soldCount": 2400,
        "stock": 750,
        "categoryName": "Hoodies"
      },
      {
        "id": 14,
        "name": "Pear",
        "price": 3.00,
        "thumbnailUrl": "/images/products/pear-1.jpg",
        "rating": 4.00,
        "ratingCount": 40,
        "soldCount": 900,
        "stock": 100,
        "categoryName": "Fresh Fruits"
      }
    ],
    "page": 0,
    "size": 2,
    "totalElements": 19,
    "totalPages": 10,
    "last": false
  }
}
```

---

## 5. Sort by Rating Desc: `GET /api/v1/products?sort=ratingAvg,desc&size=2`

### Command
```bash
curl.exe -i "http://localhost:8080/api/v1/products?sort=ratingAvg,desc&size=2"
```

### Response
```http
HTTP/1.1 200 
Content-Type: application/json

{
  "success": true,
  "data": {
    "content": [
      {
        "id": 16,
        "name": "Cherry",
        "price": 10.00,
        "thumbnailUrl": "/images/products/cherry-1.jpg",
        "rating": 5.00,
        "ratingCount": 77,
        "soldCount": 640,
        "stock": 100,
        "categoryName": "Fresh Fruits"
      },
      {
        "id": 11,
        "name": "Leather Bag",
        "price": 119.70,
        "originalPrice": 171.00,
        "thumbnailUrl": "/images/products/leather-bag-1.jpg",
        "rating": 4.50,
        "ratingCount": 210,
        "soldCount": 760,
        "stock": 100,
        "categoryName": "Bags"
      }
    ],
    "page": 0,
    "size": 2,
    "totalElements": 19,
    "totalPages": 10,
    "last": false
  }
}
```

---

## 6. Invalid Sort Field: `GET /api/v1/products?sort=price,asc&size=2` (500 Error)

### Command
```bash
curl.exe -i "http://localhost:8080/api/v1/products?sort=price,asc&size=2"
```

### Response
```http
HTTP/1.1 500 
Content-Type: application/json

{
  "timestamp": "2026-10-11T19:11:53.0056338",
  "status": 500,
  "code": "INTERNAL_ERROR",
  "message": "An unexpected error occurred",
  "path": "/api/v1/products"
}
```
*Ghi chú: Lỗi 500 xảy ra vì thuộc tính `price` không tồn tại trực tiếp trên Product Entity (JPA mapping là `minPrice`). Spring Data ném `PropertyReferenceException`, GlobalExceptionHandler trả về mã lỗi 500.*

