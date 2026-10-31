USE product_db;
SET NAMES utf8mb4;
-- External directory entries are not merchant accounts, offers, stock or reviews.
CREATE TABLE IF NOT EXISTS catalog_source_shops (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(200) NOT NULL, provider VARCHAR(60) NOT NULL,
 source_url VARCHAR(500) NOT NULL UNIQUE,
 status VARCHAR(40) NOT NULL, checked_at DATETIME(3) NOT NULL,
 note TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS catalog_source_shop_categories (
 source_shop_id BIGINT UNSIGNED NOT NULL, category_id BIGINT UNSIGNED NOT NULL,
 PRIMARY KEY(source_shop_id,category_id),
 FOREIGN KEY(source_shop_id) REFERENCES catalog_source_shops(id),
 FOREIGN KEY(category_id) REFERENCES categories(id)
);
INSERT INTO catalog_source_shops(name,provider,source_url,status,checked_at,note)
VALUES('Apple Flagship Store','Shopee','https://shopee.vn/apple_flagship_store','PROFILE_ONLY',UTC_TIMESTAMP(3),'Đã đọc trang giới thiệu nguồn. Shopee chặn truy cập catalog tự động; chưa nhập sản phẩm, giá, ảnh hay đánh giá của shop. Đây là shop bên ngoài E-Shop.')
ON DUPLICATE KEY UPDATE name=VALUES(name),status=VALUES(status),checked_at=VALUES(checked_at),note=VALUES(note);
INSERT IGNORE INTO catalog_source_shop_categories(source_shop_id,category_id)
SELECT s.id,c.id FROM catalog_source_shops s CROSS JOIN categories c
WHERE s.source_url='https://shopee.vn/apple_flagship_store' AND c.id IN (32,33,34,35,36);
