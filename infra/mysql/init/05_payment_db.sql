-- =====================================================================
-- 05_payment_db.sql | payment-service
-- Phương thức thanh toán (không lưu số thẻ thật), giao dịch, hoàn tiền
-- =====================================================================
USE payment_db;
SET NAMES utf8mb4;

CREATE TABLE payment_methods (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  type           ENUM('CARD','PAYPAL') NOT NULL,
  brand          ENUM('VISA','MAESTRO','MASTERCARD','PAYPAL','OTHER') NOT NULL,
  last4          CHAR(4) NULL,
  holder_name    VARCHAR(120) NULL,
  exp_month      TINYINT UNSIGNED NULL,
  exp_year       SMALLINT UNSIGNED NULL,
  paypal_email   VARCHAR(255) NULL,
  provider_token VARCHAR(255) NULL COMMENT 'Token từ cổng thanh toán. KHÔNG lưu số thẻ/CVV',
  is_default     TINYINT(1) NOT NULL DEFAULT 0,
  status         ENUM('ACTIVE','REMOVED') NOT NULL DEFAULT 'ACTIVE',
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at     DATETIME(3) NULL,
  PRIMARY KEY (id),
  KEY idx_pm_user (user_id, status),
  CONSTRAINT chk_pm_shape CHECK (
    (type = 'CARD'   AND last4 IS NOT NULL) OR
    (type = 'PAYPAL' AND paypal_email IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE payments (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_no        VARCHAR(32) NOT NULL,
  order_id          BIGINT UNSIGNED NOT NULL COMMENT 'order_db.orders.id',
  order_no          VARCHAR(32) NOT NULL,
  user_id           BIGINT UNSIGNED NOT NULL,
  payment_method_id BIGINT UNSIGNED NULL,
  method_type       VARCHAR(20) NOT NULL,
  method_brand      VARCHAR(20) NULL,
  method_last4      CHAR(4) NULL,
  amount            DECIMAL(12,2) NOT NULL,
  currency          CHAR(3) NOT NULL DEFAULT 'USD',
  status            ENUM('PENDING','SUCCESS','FAILED','CANCELLED','PARTIALLY_REFUNDED','REFUNDED')
                    NOT NULL DEFAULT 'PENDING',
  provider          ENUM('MOCK','PAYPAL_SANDBOX','STRIPE_TEST') NOT NULL DEFAULT 'MOCK',
  provider_txn_id   VARCHAR(100) NULL,
  failure_code      VARCHAR(50) NULL,
  failure_message   VARCHAR(255) NULL,
  idempotency_key   VARCHAR(64) NOT NULL,
  paid_at           DATETIME(3) NULL,
  version           BIGINT NOT NULL DEFAULT 0,
  created_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_payments_no   (payment_no),
  UNIQUE KEY uk_payments_idem (idempotency_key),
  KEY idx_payments_order  (order_id),
  KEY idx_payments_user   (user_id, created_at),
  KEY idx_payments_status (status, created_at),
  CONSTRAINT fk_payments_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL,
  CONSTRAINT chk_payments_amount CHECK (amount > 0)
) ENGINE=InnoDB;

-- Sổ cái: mọi lần gọi cổng thanh toán đều ghi lại
CREATE TABLE payment_transactions (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_id       BIGINT UNSIGNED NOT NULL,
  type             ENUM('AUTHORIZE','CHARGE','REFUND','VOID') NOT NULL,
  amount           DECIMAL(12,2) NOT NULL,
  status           ENUM('PENDING','SUCCESS','FAILED') NOT NULL,
  provider_txn_id  VARCHAR(100) NULL,
  request_payload  JSON NULL,
  response_payload JSON NULL,
  error_message    VARCHAR(255) NULL,
  created_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_ptx_payment (payment_id, created_at),
  CONSTRAINT fk_ptx_payment FOREIGN KEY (payment_id) REFERENCES payments(id)
) ENGINE=InnoDB;

CREATE TABLE refunds (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_id         BIGINT UNSIGNED NOT NULL,
  return_id          BIGINT UNSIGNED NULL COMMENT 'order_db.order_returns.id',
  amount             DECIMAL(12,2) NOT NULL,
  reason             VARCHAR(255) NULL,
  status             ENUM('PENDING','SUCCESS','FAILED') NOT NULL DEFAULT 'PENDING',
  provider_refund_id VARCHAR(100) NULL,
  created_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  processed_at       DATETIME(3) NULL,
  PRIMARY KEY (id),
  KEY idx_refunds_payment (payment_id),
  CONSTRAINT fk_refunds_payment FOREIGN KEY (payment_id) REFERENCES payments(id),
  CONSTRAINT chk_refunds_amount CHECK (amount > 0)
) ENGINE=InnoDB;

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
