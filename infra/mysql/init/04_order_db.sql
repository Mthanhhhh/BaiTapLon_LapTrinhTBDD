-- =====================================================================
-- 04_order_db.sql | order-service
-- Giỏ hàng, voucher, vận chuyển, đơn hàng (snapshot), trả hàng, outbox
-- Công thức: total = subtotal - discount + tax + shipping_fee + service_fee
-- (cột "Fees" trên UI = shipping_fee + service_fee)
-- =====================================================================
USE order_db;
SET NAMES utf8mb4;

-- ---------- Giỏ hàng (bản bền vững; bản nóng nằm trong Redis) ----------
CREATE TABLE carts (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_carts_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE cart_items (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  cart_id     BIGINT UNSIGNED NOT NULL,
  shop_id     BIGINT UNSIGNED NOT NULL,
  product_id  BIGINT UNSIGNED NOT NULL,
  sku_id      BIGINT UNSIGNED NOT NULL,
  quantity    SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  is_selected TINYINT(1) NOT NULL DEFAULT 1,
  added_price DECIMAL(12,2) NOT NULL COMMENT 'Giá lúc thêm, để báo "giá đã thay đổi"',
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_cart_sku (cart_id, sku_id),
  KEY idx_cart_shop (cart_id, shop_id),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT chk_cart_qty CHECK (quantity BETWEEN 1 AND 99)
) ENGINE=InnoDB;

-- ---------- Vận chuyển ----------
CREATE TABLE shipping_methods (
  id                 TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code               VARCHAR(20) NOT NULL,
  name               VARCHAR(60) NOT NULL,
  min_delivery_hours INT UNSIGNED NOT NULL,
  max_delivery_hours INT UNSIGNED NOT NULL,
  base_fee           DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  is_active          TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uk_shipping_code (code)
) ENGINE=InnoDB;

-- ---------- Voucher ----------
CREATE TABLE vouchers (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code                VARCHAR(40) NOT NULL,
  name                VARCHAR(150) NOT NULL,
  description         VARCHAR(500) NULL,
  scope               ENUM('PLATFORM','SHOP') NOT NULL DEFAULT 'PLATFORM',
  shop_id             BIGINT UNSIGNED NULL,
  discount_type       ENUM('PERCENT','FIXED') NOT NULL,
  discount_value      DECIMAL(12,2) NOT NULL,
  max_discount_amount DECIMAL(12,2) NULL COMMENT 'Trần giảm khi dùng PERCENT',
  min_order_amount    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_quantity      INT UNSIGNED NOT NULL,
  used_quantity       INT UNSIGNED NOT NULL DEFAULT 0,
  per_user_limit      TINYINT UNSIGNED NOT NULL DEFAULT 1,
  starts_at           DATETIME(3) NOT NULL,
  ends_at             DATETIME(3) NOT NULL,
  status              ENUM('ACTIVE','PAUSED','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
  version             BIGINT NOT NULL DEFAULT 0,
  created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_vouchers_code (code),
  KEY idx_vouchers_active (status, starts_at, ends_at),
  CONSTRAINT chk_voucher_used    CHECK (used_quantity <= total_quantity),
  CONSTRAINT chk_voucher_percent CHECK (discount_type <> 'PERCENT' OR discount_value <= 100),
  CONSTRAINT chk_voucher_time    CHECK (ends_at > starts_at)
) ENGINE=InnoDB;

CREATE TABLE user_vouchers (
  user_id      BIGINT UNSIGNED NOT NULL,
  voucher_id   BIGINT UNSIGNED NOT NULL,
  collected_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id, voucher_id),
  CONSTRAINT fk_uv_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Ví voucher đã lưu';

-- ---------- Đơn hàng ----------
CREATE TABLE orders (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_no             VARCHAR(32) NOT NULL COMMENT 'vd EC20261006000001',
  user_id              BIGINT UNSIGNED NOT NULL,
  status               ENUM('PENDING_PAYMENT','PAID','SHIPPING','DELIVERED','CANCELLED','RETURNED')
                       NOT NULL DEFAULT 'PENDING_PAYMENT',
  payment_status       ENUM('UNPAID','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'UNPAID',
  currency             CHAR(3) NOT NULL DEFAULT 'USD',
  voucher_id           BIGINT UNSIGNED NULL,
  voucher_code         VARCHAR(40) NULL,
  subtotal_amount      DECIMAL(12,2) NOT NULL,
  discount_amount      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_rate             DECIMAL(5,4)  NOT NULL DEFAULT 0.1000,
  tax_amount           DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  shipping_fee         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  service_fee          DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_amount         DECIMAL(12,2) NOT NULL,
  payment_method_type  VARCHAR(20) NULL,
  payment_method_label VARCHAR(60) NULL COMMENT 'vd VISA ****2334',
  shipping_method_code VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
  recipient_name       VARCHAR(120) NOT NULL,
  recipient_phone      VARCHAR(20)  NOT NULL,
  ship_country         CHAR(2) NOT NULL DEFAULT 'VN',
  ship_province        VARCHAR(100) NOT NULL,
  ship_district        VARCHAR(100) NOT NULL,
  ship_ward            VARCHAR(100) NULL,
  ship_address_line    VARCHAR(255) NOT NULL,
  ship_postal_code     VARCHAR(20)  NULL,
  note                 VARCHAR(500) NULL,
  cancel_reason        VARCHAR(255) NULL,
  idempotency_key      VARCHAR(64) NOT NULL COMMENT 'Client gửi để chống tạo đơn trùng',
  expires_at           DATETIME(3) NULL COMMENT 'Hết hạn thanh toán -> tự huỷ, nhả kho',
  paid_at              DATETIME(3) NULL,
  shipped_at           DATETIME(3) NULL,
  delivered_at         DATETIME(3) NULL,
  cancelled_at         DATETIME(3) NULL,
  version              BIGINT NOT NULL DEFAULT 0,
  created_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_orders_no (order_no),
  UNIQUE KEY uk_orders_idem (user_id, idempotency_key),
  KEY idx_orders_user    (user_id, created_at),
  KEY idx_orders_status  (status, created_at),
  KEY idx_orders_expires (status, expires_at),
  CONSTRAINT fk_orders_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id) ON DELETE SET NULL,
  CONSTRAINT chk_orders_money  CHECK (subtotal_amount >= 0 AND discount_amount >= 0 AND discount_amount <= subtotal_amount),
  CONSTRAINT chk_orders_total  CHECK (total_amount = subtotal_amount - discount_amount + tax_amount + shipping_fee + service_fee)
) ENGINE=InnoDB;

-- Mỗi shop trong 1 đơn có 1 kiện hàng (marketplace)
CREATE TABLE shipments (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id             BIGINT UNSIGNED NOT NULL,
  shop_id              BIGINT UNSIGNED NOT NULL,
  shipping_method_code VARCHAR(20) NOT NULL,
  carrier              VARCHAR(60) NULL,
  tracking_no          VARCHAR(64) NULL,
  status               ENUM('PENDING','PACKED','SHIPPING','DELIVERED','FAILED','RETURNED') NOT NULL DEFAULT 'PENDING',
  shipping_fee         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  estimated_delivery_at DATETIME(3) NULL,
  shipped_at           DATETIME(3) NULL,
  delivered_at         DATETIME(3) NULL,
  created_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_shipments (order_id, shop_id),
  KEY idx_shipments_tracking (tracking_no),
  KEY idx_shipments_shop (shop_id, status),
  CONSTRAINT fk_shipments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE order_items (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id       BIGINT UNSIGNED NOT NULL,
  shipment_id    BIGINT UNSIGNED NULL,
  shop_id        BIGINT UNSIGNED NOT NULL,
  product_id     BIGINT UNSIGNED NOT NULL,
  sku_id         BIGINT UNSIGNED NOT NULL,
  product_name   VARCHAR(255) NOT NULL COMMENT 'Snapshot: tên/giá/ảnh tại thời điểm mua',
  sku_name       VARCHAR(255) NULL,
  image_url      VARCHAR(500) NULL,
  unit_price     DECIMAL(12,2) NOT NULL,
  original_price DECIMAL(12,2) NULL,
  quantity       SMALLINT UNSIGNED NOT NULL,
  line_total     DECIMAL(12,2) GENERATED ALWAYS AS (unit_price * quantity) STORED,
  is_reviewed    TINYINT(1) NOT NULL DEFAULT 0,
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_oi_order (order_id),
  KEY idx_oi_shop  (shop_id, order_id),
  KEY idx_oi_sku   (sku_id),
  CONSTRAINT fk_oi_order    FOREIGN KEY (order_id)    REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_shipment FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE SET NULL,
  CONSTRAINT chk_oi_qty CHECK (quantity > 0 AND unit_price >= 0)
) ENGINE=InnoDB;

CREATE TABLE order_status_history (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id    BIGINT UNSIGNED NOT NULL,
  from_status VARCHAR(30) NULL,
  to_status   VARCHAR(30) NOT NULL,
  note        VARCHAR(255) NULL,
  changed_by  BIGINT UNSIGNED NULL COMMENT 'NULL = hệ thống',
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_osh_order (order_id, created_at),
  CONSTRAINT fk_osh_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE voucher_usages (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  voucher_id      BIGINT UNSIGNED NOT NULL,
  user_id         BIGINT UNSIGNED NOT NULL,
  order_id        BIGINT UNSIGNED NOT NULL,
  discount_amount DECIMAL(12,2) NOT NULL,
  used_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_vu_order (order_id) COMMENT 'Mỗi đơn tối đa 1 voucher',
  KEY idx_vu_user (voucher_id, user_id),
  CONSTRAINT fk_vu_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers(id),
  CONSTRAINT fk_vu_order   FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- Trả hàng (30-day free return) ----------
CREATE TABLE order_returns (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id      BIGINT UNSIGNED NOT NULL,
  order_item_id BIGINT UNSIGNED NOT NULL,
  user_id       BIGINT UNSIGNED NOT NULL,
  reason        ENUM('DEFECTIVE','WRONG_ITEM','NOT_AS_DESCRIBED','CHANGED_MIND','OTHER') NOT NULL,
  description   VARCHAR(1000) NULL,
  status        ENUM('REQUESTED','APPROVED','REJECTED','RECEIVED','REFUNDED') NOT NULL DEFAULT 'REQUESTED',
  refund_amount DECIMAL(12,2) NULL,
  requested_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  resolved_at   DATETIME(3) NULL,
  updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_returns_order (order_id),
  KEY idx_returns_user (user_id, status),
  CONSTRAINT fk_returns_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_returns_item  FOREIGN KEY (order_item_id) REFERENCES order_items(id)
) ENGINE=InnoDB;

-- ---------- Outbox + idempotent consumer ----------
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
