USE product_db;
CREATE TABLE IF NOT EXISTS classroom_catalog_shops (
 brand_key VARCHAR(100) PRIMARY KEY, shop_id BIGINT UNSIGNED NOT NULL UNIQUE,
 source_url VARCHAR(500) NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY(shop_id) REFERENCES shops(id)
);
CREATE TABLE IF NOT EXISTS shop_category_links (
 shop_id BIGINT UNSIGNED NOT NULL, category_id BIGINT UNSIGNED NOT NULL,
 PRIMARY KEY(shop_id,category_id), FOREIGN KEY(shop_id) REFERENCES shops(id), FOREIGN KEY(category_id) REFERENCES categories(id)
);
CREATE TABLE IF NOT EXISTS classroom_catalog_products (
 source_key CHAR(64) PRIMARY KEY, product_id BIGINT UNSIGNED NOT NULL UNIQUE,
 brand_key VARCHAR(100) NOT NULL, source_url VARCHAR(1000) NOT NULL,
 checked_at DATETIME(3) NOT NULL, FOREIGN KEY(product_id) REFERENCES products(id),
 FOREIGN KEY(brand_key) REFERENCES classroom_catalog_shops(brand_key)
);
