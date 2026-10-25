-- =====================================================================
-- 03_product_db.sql | product-service
-- Shop, danh mục, sản phẩm, biến thể (SKU), tồn kho, flash sale,
-- banner, review, favorites, outbox (Kafka)
-- Không có FK sang database khác: user_id/order_id chỉ là ID tham chiếu.
-- =====================================================================
USE product_db;
SET NAMES utf8mb4;

-- ---------- Shop & thương hiệu ----------
CREATE TABLE shops (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id  BIGINT UNSIGNED NOT NULL COMMENT 'auth_db.users.id',
  name           VARCHAR(150) NOT NULL,
  slug           VARCHAR(170) NOT NULL,
  logo_url       VARCHAR(500) NULL,
  banner_url     VARCHAR(500) NULL,
  description    TEXT NULL,
  province       VARCHAR(100) NULL,
  is_authorized  TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Authorized shop',
  rating_avg     DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  rating_count   INT UNSIGNED NOT NULL DEFAULT 0,
  follower_count INT UNSIGNED NOT NULL DEFAULT 0,
  status         ENUM('PENDING','ACTIVE','SUSPENDED') NOT NULL DEFAULT 'PENDING',
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at     DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_shops_slug (slug),
  UNIQUE KEY uk_shops_owner (owner_user_id)
) ENGINE=InnoDB;

CREATE TABLE brands (
  id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name     VARCHAR(100) NOT NULL,
  slug     VARCHAR(120) NOT NULL,
  logo_url VARCHAR(500) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_brands_slug (slug)
) ENGINE=InnoDB;

-- ---------- Danh mục (cây nhiều cấp) ----------
CREATE TABLE categories (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_id   BIGINT UNSIGNED NULL,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(120) NOT NULL,
  icon_url    VARCHAR(500) NULL,
  image_url   VARCHAR(500) NULL,
  theme_color CHAR(7) NULL COMMENT 'Màu nền vòng tròn danh mục trên Home',
  level       TINYINT UNSIGNED NOT NULL DEFAULT 1,
  path        VARCHAR(255) NOT NULL DEFAULT '/' COMMENT 'Materialized path, vd /1/14/',
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_categories_slug (slug),
  KEY idx_categories_parent (parent_id, sort_order),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id)
) ENGINE=InnoDB;

-- ---------- Sản phẩm ----------
CREATE TABLE products (
  id                     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  shop_id                BIGINT UNSIGNED NOT NULL,
  category_id            BIGINT UNSIGNED NOT NULL,
  brand_id               BIGINT UNSIGNED NULL,
  name                   VARCHAR(255) NOT NULL,
  slug                   VARCHAR(280) NOT NULL,
  short_description      VARCHAR(500) NULL,
  description            TEXT NULL,
  thumbnail_url          VARCHAR(500) NULL,
  currency               CHAR(3) NOT NULL DEFAULT 'USD',
  min_price              DECIMAL(12,2) NOT NULL,
  max_price              DECIMAL(12,2) NOT NULL,
  original_price         DECIMAL(12,2) NULL COMMENT 'Giá gốc để hiện giảm giá',
  discount_percent       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  promo_label            VARCHAR(60) NULL COMMENT 'vd Buy 1 get 1',
  attributes             JSON NULL COMMENT 'Thuộc tính linh hoạt: xuất xứ, cấu hình...',
  weight_grams           INT UNSIGNED NULL,
  has_free_return_30d    TINYINT(1) NOT NULL DEFAULT 0,
  has_buyer_protection   TINYINT(1) NOT NULL DEFAULT 0,
  is_best_deal           TINYINT(1) NOT NULL DEFAULT 0,
  supports_ship_to_store TINYINT(1) NOT NULL DEFAULT 0,
  rating_avg             DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  rating_count          INT UNSIGNED NOT NULL DEFAULT 0,
  sold_count             INT UNSIGNED NOT NULL DEFAULT 0,
  view_count             INT UNSIGNED NOT NULL DEFAULT 0,
  favorite_count         INT UNSIGNED NOT NULL DEFAULT 0,
  status                 ENUM('DRAFT','ACTIVE','HIDDEN','BANNED') NOT NULL DEFAULT 'DRAFT',
  version                BIGINT NOT NULL DEFAULT 0 COMMENT 'Optimistic lock (@Version)',
  created_at             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at             DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_products_slug (slug),
  KEY idx_products_cat_sold   (category_id, status, sold_count),
  KEY idx_products_cat_price  (category_id, status, min_price),
  KEY idx_products_cat_rating (category_id, status, rating_avg),
  KEY idx_products_shop       (shop_id, status),
  KEY idx_products_status_new  (status, created_at),
  FULLTEXT KEY ft_products_name (name) WITH PARSER ngram,
  CONSTRAINT fk_products_shop     FOREIGN KEY (shop_id)     REFERENCES shops(id),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_products_brand    FOREIGN KEY (brand_id)    REFERENCES brands(id),
  CONSTRAINT chk_products_price   CHECK (min_price >= 0 AND max_price >= min_price),
  CONSTRAINT chk_products_rating  CHECK (rating_avg BETWEEN 0 AND 5)
) ENGINE=InnoDB;

-- Lọc Shipping: Instant / Express / Standard
CREATE TABLE product_shipping_options (
  product_id  BIGINT UNSIGNED NOT NULL,
  method_code ENUM('INSTANT','EXPRESS','STANDARD') NOT NULL,
  PRIMARY KEY (product_id, method_code),
  KEY idx_pso_method (method_code),
  CONSTRAINT fk_pso_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- Tuỳ chọn (Color, Size) & SKU ----------
CREATE TABLE product_options (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  name       VARCHAR(50) NOT NULL COMMENT 'Color, Size...',
  sort_order TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_options (product_id, name),
  CONSTRAINT fk_options_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE product_option_values (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  option_id  BIGINT UNSIGNED NOT NULL,
  value      VARCHAR(80) NOT NULL,
  color_hex  CHAR(7) NULL,
  image_url  VARCHAR(500) NULL,
  sort_order TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_option_values (option_id, value),
  CONSTRAINT fk_ov_option FOREIGN KEY (option_id) REFERENCES product_options(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE product_skus (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id     BIGINT UNSIGNED NOT NULL,
  sku_code       VARCHAR(64) NOT NULL,
  name           VARCHAR(255) NOT NULL COMMENT 'vd Blue / M',
  price          DECIMAL(12,2) NOT NULL,
  original_price DECIMAL(12,2) NULL,
  stock_quantity INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Tồn khả dụng; giữ chỗ sẽ trừ ngay',
  sold_count     INT UNSIGNED NOT NULL DEFAULT 0,
  status         ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  version        BIGINT NOT NULL DEFAULT 0,
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at     DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_sku_code (sku_code),
  KEY idx_sku_product (product_id, status),
  CONSTRAINT fk_sku_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT chk_sku_price  CHECK (price >= 0)
) ENGINE=InnoDB;

CREATE TABLE sku_option_values (
  sku_id          BIGINT UNSIGNED NOT NULL,
  option_value_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (sku_id, option_value_id),
  KEY idx_sov_value (option_value_id),
  CONSTRAINT fk_sov_sku   FOREIGN KEY (sku_id) REFERENCES product_skus(id) ON DELETE CASCADE,
  CONSTRAINT fk_sov_value FOREIGN KEY (option_value_id) REFERENCES product_option_values(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE product_images (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id      BIGINT UNSIGNED NOT NULL,
  option_value_id BIGINT UNSIGNED NULL COMMENT 'Ảnh theo màu',
  url             VARCHAR(500) NOT NULL,
  sort_order      SMALLINT NOT NULL DEFAULT 0,
  is_primary      TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_images_product (product_id, sort_order),
  CONSTRAINT fk_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_images_value   FOREIGN KEY (option_value_id) REFERENCES product_option_values(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------- Tồn kho: sổ cái + giữ chỗ (Saga) ----------
CREATE TABLE inventory_movements (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sku_id         BIGINT UNSIGNED NOT NULL,
  delta          INT NOT NULL COMMENT 'Âm = xuất, dương = nhập',
  stock_after    INT UNSIGNED NOT NULL,
  reason         ENUM('INITIAL','RESERVE','RELEASE','RETURN','ADJUST') NOT NULL,
  reference_type VARCHAR(30) NULL,
  reference_id   VARCHAR(64) NULL COMMENT 'vd order_no',
  created_by     BIGINT UNSIGNED NULL,
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_im_sku (sku_id, created_at),
  KEY idx_im_ref (reference_type, reference_id),
  CONSTRAINT fk_im_sku FOREIGN KEY (sku_id) REFERENCES product_skus(id)
) ENGINE=InnoDB;

CREATE TABLE stock_reservations (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id   BIGINT UNSIGNED NOT NULL COMMENT 'order_db.orders.id',
  order_no   VARCHAR(32) NOT NULL,
  sku_id     BIGINT UNSIGNED NOT NULL,
  quantity   INT UNSIGNED NOT NULL,
  status     ENUM('HELD','COMMITTED','RELEASED','EXPIRED') NOT NULL DEFAULT 'HELD',
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_resv (order_no, sku_id) COMMENT 'Idempotent khi Kafka gửi trùng',
  KEY idx_resv_sweep (status, expires_at),
  CONSTRAINT fk_resv_sku FOREIGN KEY (sku_id) REFERENCES product_skus(id),
  CONSTRAINT chk_resv_qty CHECK (quantity > 0)
) ENGINE=InnoDB;

-- ---------- Flash sale & banner ----------
CREATE TABLE flash_sales (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title      VARCHAR(150) NOT NULL,
  banner_url VARCHAR(500) NULL,
  starts_at  DATETIME(3) NOT NULL,
  ends_at    DATETIME(3) NOT NULL,
  status     ENUM('SCHEDULED','RUNNING','ENDED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_fs_status (status, starts_at),
  CONSTRAINT chk_fs_time CHECK (ends_at > starts_at)
) ENGINE=InnoDB;

CREATE TABLE flash_sale_items (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  flash_sale_id  BIGINT UNSIGNED NOT NULL,
  sku_id         BIGINT UNSIGNED NOT NULL,
  sale_price     DECIMAL(12,2) NOT NULL,
  quota          INT UNSIGNED NOT NULL,
  sold           INT UNSIGNED NOT NULL DEFAULT 0,
  limit_per_user TINYINT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uk_fsi (flash_sale_id, sku_id),
  CONSTRAINT fk_fsi_sale FOREIGN KEY (flash_sale_id) REFERENCES flash_sales(id) ON DELETE CASCADE,
  CONSTRAINT fk_fsi_sku  FOREIGN KEY (sku_id) REFERENCES product_skus(id),
  CONSTRAINT chk_fsi_sold CHECK (sold <= quota)
) ENGINE=InnoDB;

CREATE TABLE banners (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title            VARCHAR(150) NOT NULL,
  subtitle         VARCHAR(150) NULL,
  image_url        VARCHAR(500) NOT NULL,
  background_color CHAR(7) NULL,
  cta_text         VARCHAR(40) NULL,
  link_type        ENUM('PRODUCT','CATEGORY','FLASH_SALE','URL') NOT NULL,
  link_target      VARCHAR(255) NOT NULL,
  position         ENUM('HOME_HERO','HOME_GRID','CATEGORY_TOP') NOT NULL,
  badge_text       VARCHAR(20) NULL COMMENT 'vd 30%',
  sort_order       SMALLINT NOT NULL DEFAULT 0,
  starts_at        DATETIME(3) NULL,
  ends_at          DATETIME(3) NULL,
  is_active        TINYINT(1) NOT NULL DEFAULT 1,
  created_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_banners_pos (position, is_active, sort_order)
) ENGINE=InnoDB;

-- ---------- Review & Feedback ----------
CREATE TABLE reviews (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id          BIGINT UNSIGNED NOT NULL,
  sku_id              BIGINT UNSIGNED NULL,
  user_id             BIGINT UNSIGNED NOT NULL COMMENT 'auth_db.users.id',
  order_id            BIGINT UNSIGNED NOT NULL COMMENT 'order_db.orders.id',
  order_item_id       BIGINT UNSIGNED NOT NULL COMMENT 'order_db.order_items.id',
  reviewer_name       VARCHAR(120) NOT NULL COMMENT 'Snapshot để khỏi gọi sang auth',
  reviewer_avatar_url VARCHAR(500) NULL,
  rating              TINYINT UNSIGNED NOT NULL,
  sentiment           ENUM('BAD','NEUTRAL','GOOD') NULL COMMENT '3 emoji ở màn Feedback',
  content             TEXT NULL,
  is_anonymous        TINYINT(1) NOT NULL DEFAULT 0,
  status              ENUM('VISIBLE','HIDDEN','PENDING') NOT NULL DEFAULT 'VISIBLE',
  like_count          INT UNSIGNED NOT NULL DEFAULT 0,
  seller_reply        TEXT NULL,
  seller_replied_at   DATETIME(3) NULL,
  created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at          DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_reviews_item (order_item_id, user_id) COMMENT 'Mỗi món 1 review',
  KEY idx_reviews_product (product_id, status, created_at),
  KEY idx_reviews_rating  (product_id, rating),
  KEY idx_reviews_user    (user_id),
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE TABLE review_images (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  review_id  BIGINT UNSIGNED NOT NULL,
  url        VARCHAR(500) NOT NULL,
  sort_order TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_ri_review (review_id),
  CONSTRAINT fk_ri_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE feedback_tags (
  id   SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(30) NOT NULL,
  name VARCHAR(60) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ft_code (code)
) ENGINE=InnoDB;

CREATE TABLE review_tags (
  review_id BIGINT UNSIGNED   NOT NULL,
  tag_id    SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (review_id, tag_id),
  CONSTRAINT fk_rt_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  CONSTRAINT fk_rt_tag    FOREIGN KEY (tag_id) REFERENCES feedback_tags(id)
) ENGINE=InnoDB;

-- Biểu đồ cột 5★..1★ (tách bảng để tránh nghẽn dòng products khi nhiều review)
CREATE TABLE product_rating_stats (
  product_id BIGINT UNSIGNED NOT NULL,
  count_1    INT UNSIGNED NOT NULL DEFAULT 0,
  count_2    INT UNSIGNED NOT NULL DEFAULT 0,
  count_3    INT UNSIGNED NOT NULL DEFAULT 0,
  count_4    INT UNSIGNED NOT NULL DEFAULT 0,
  count_5    INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (product_id),
  CONSTRAINT fk_prs_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- Người dùng x sản phẩm ----------
CREATE TABLE favorites (
  user_id    BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, product_id),
  KEY idx_fav_product (product_id),
  CONSTRAINT fk_fav_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE product_promo_subscriptions (
  user_id    BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, product_id),
  CONSTRAINT fk_pps_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Toggle Notify me of promotions';

CREATE TABLE user_product_views (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  viewed_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_upv_user (user_id, viewed_at),
  KEY idx_upv_product (product_id)
) ENGINE=InnoDB COMMENT='Dữ liệu cho Recommended for you';

-- ---------- Transactional Outbox + idempotent consumer ----------
CREATE TABLE outbox_events (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id       CHAR(36) NOT NULL,
  aggregate_type VARCHAR(50) NOT NULL,
  aggregate_id   VARCHAR(64) NOT NULL,
  event_type     VARCHAR(100) NOT NULL,
  topic          VARCHAR(100) NOT NULL,
  payload        JSON NOT NULL,
  status         ENUM('PENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
  retry_count    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  sent_at        DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_outbox_event (event_id),
  KEY idx_outbox_status (status, id)
) ENGINE=InnoDB;

CREATE TABLE processed_events (
  event_id     CHAR(36) NOT NULL,
  consumer     VARCHAR(100) NOT NULL,
  processed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (event_id, consumer)
) ENGINE=InnoDB;
