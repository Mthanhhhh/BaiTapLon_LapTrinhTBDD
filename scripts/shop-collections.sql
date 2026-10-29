USE product_db;
CREATE TABLE IF NOT EXISTS shop_collections (
 id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
 shop_id BIGINT UNSIGNED NOT NULL,
 name VARCHAR(100) NOT NULL,
 sort_order INT NOT NULL DEFAULT 0,
 FOREIGN KEY(shop_id) REFERENCES shops(id)
);
CREATE TABLE IF NOT EXISTS shop_collection_products (
 collection_id BIGINT UNSIGNED NOT NULL,
 product_id BIGINT UNSIGNED NOT NULL,
 PRIMARY KEY(collection_id,product_id),
 FOREIGN KEY(collection_id) REFERENCES shop_collections(id) ON DELETE CASCADE,
 FOREIGN KEY(product_id) REFERENCES products(id)
);
