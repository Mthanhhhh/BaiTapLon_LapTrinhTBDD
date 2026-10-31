USE order_db;
CREATE TABLE IF NOT EXISTS promo_campaigns (
 id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT, name VARCHAR(150) NOT NULL,
 kind VARCHAR(12) NOT NULL, layer VARCHAR(12) NOT NULL, shop_id BIGINT UNSIGNED NULL,
 code VARCHAR(40) NULL UNIQUE, discount_type VARCHAR(12) NOT NULL DEFAULT 'FIXED', value DECIMAL(12,2) NOT NULL DEFAULT 0,
 min_order DECIMAL(12,2) NOT NULL DEFAULT 0, max_discount DECIMAL(12,2) NULL,
 budget_total DECIMAL(15,2) NOT NULL, budget_reserved DECIMAL(15,2) NOT NULL DEFAULT 0, budget_spent DECIMAL(15,2) NOT NULL DEFAULT 0,
 quota_total INT NOT NULL, quota_reserved INT NOT NULL DEFAULT 0, quota_used INT NOT NULL DEFAULT 0,
 per_user_limit INT NOT NULL DEFAULT 1, stackable BOOLEAN NOT NULL DEFAULT TRUE,
 starts_at DATETIME(3) NOT NULL, ends_at DATETIME(3) NOT NULL, status VARCHAR(12) NOT NULL DEFAULT 'ACTIVE',
 created_by BIGINT UNSIGNED NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX ix_promo_window(status,starts_at,ends_at), CHECK(quota_reserved>=0 AND quota_used>=0 AND quota_reserved+quota_used<=quota_total),
 CHECK(budget_reserved>=0 AND budget_spent>=0 AND budget_reserved+budget_spent<=budget_total)
);
CREATE TABLE IF NOT EXISTS promo_flash_items (
 id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT, campaign_id BIGINT UNSIGNED NOT NULL,
 product_id BIGINT UNSIGNED NOT NULL, sku_id BIGINT UNSIGNED NOT NULL, sale_price DECIMAL(12,2) NOT NULL,
 quota_total INT NOT NULL, quota_reserved INT NOT NULL DEFAULT 0, quota_used INT NOT NULL DEFAULT 0, per_user_limit INT NOT NULL,
 UNIQUE KEY uq_flash_sku(campaign_id,sku_id), INDEX ix_flash_sku(sku_id), FOREIGN KEY(campaign_id) REFERENCES promo_campaigns(id),
 CHECK(quota_reserved>=0 AND quota_used>=0 AND quota_reserved+quota_used<=quota_total)
);
CREATE TABLE IF NOT EXISTS promo_wallet (
 user_id BIGINT UNSIGNED NOT NULL, campaign_id BIGINT UNSIGNED NOT NULL, saved_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY(user_id,campaign_id), FOREIGN KEY(campaign_id) REFERENCES promo_campaigns(id)
);
CREATE TABLE IF NOT EXISTS promo_reservations (
 order_id BIGINT UNSIGNED PRIMARY KEY, user_id BIGINT UNSIGNED NOT NULL, state VARCHAR(12) NOT NULL,
 expires_at DATETIME(3) NULL, pricing_snapshot JSON NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX ix_reservation_expiry(state,expires_at), FOREIGN KEY(order_id) REFERENCES orders(id)
);
CREATE TABLE IF NOT EXISTS promo_redemptions (
 order_id BIGINT UNSIGNED NOT NULL, campaign_id BIGINT UNSIGNED NOT NULL, discount_amount DECIMAL(12,2) NOT NULL,
 PRIMARY KEY(order_id,campaign_id), FOREIGN KEY(order_id) REFERENCES promo_reservations(order_id), FOREIGN KEY(campaign_id) REFERENCES promo_campaigns(id)
);
CREATE TABLE IF NOT EXISTS promo_flash_reservations (
 order_id BIGINT UNSIGNED NOT NULL, flash_item_id BIGINT UNSIGNED NOT NULL, quantity INT NOT NULL,
 PRIMARY KEY(order_id,flash_item_id), FOREIGN KEY(order_id) REFERENCES promo_reservations(order_id), FOREIGN KEY(flash_item_id) REFERENCES promo_flash_items(id)
);
CREATE TABLE IF NOT EXISTS promo_reminders (
 user_id BIGINT UNSIGNED NOT NULL, campaign_id BIGINT UNSIGNED NOT NULL, sent_at DATETIME(3) NULL,
 PRIMARY KEY(user_id,campaign_id), FOREIGN KEY(campaign_id) REFERENCES promo_campaigns(id)
);
CREATE TABLE IF NOT EXISTS promo_outbox (
 event_id VARCHAR(36) PRIMARY KEY, type VARCHAR(50) NOT NULL, payload JSON NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 published_at DATETIME(3) NULL, claimed_until DATETIME(3) NULL, attempts INT NOT NULL DEFAULT 0, INDEX ix_outbox_pending(published_at,claimed_until,created_at)
);
CREATE TABLE IF NOT EXISTS promo_consumed_events (event_id VARCHAR(36) NOT NULL, consumer_name VARCHAR(40) NOT NULL, processed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), PRIMARY KEY(event_id,consumer_name));
CREATE TABLE IF NOT EXISTS promo_shipping_policy (shop_id BIGINT UNSIGNED PRIMARY KEY, fee DECIMAL(12,2) NOT NULL DEFAULT 0, CHECK(fee>=0));
