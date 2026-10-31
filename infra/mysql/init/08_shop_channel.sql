-- Shop collections used by the public storefront and seller channel.
USE product_db;

CREATE TABLE IF NOT EXISTS shop_collections (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  shop_id    BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(100) NOT NULL,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_shop_collection_name (shop_id, name),
  KEY idx_shop_collections_order (shop_id, sort_order),
  CONSTRAINT fk_shop_collections_shop FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS shop_collection_products (
  collection_id BIGINT UNSIGNED NOT NULL,
  product_id    BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (collection_id, product_id),
  KEY idx_shop_collection_product (product_id),
  CONSTRAINT fk_scp_collection FOREIGN KEY (collection_id) REFERENCES shop_collections(id) ON DELETE CASCADE,
  CONSTRAINT fk_scp_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;
