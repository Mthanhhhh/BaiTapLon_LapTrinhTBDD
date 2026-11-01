USE order_db;
CREATE TABLE IF NOT EXISTS commerce_finance_policy (
 shop_id BIGINT UNSIGNED PRIMARY KEY,
 vat_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
 commission_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
 updated_by BIGINT UNSIGNED NOT NULL, updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
 CHECK(vat_percent BETWEEN 0 AND 100), CHECK(commission_percent BETWEEN 0 AND 100)
);
CREATE TABLE IF NOT EXISTS commerce_order_finance (
 order_id BIGINT UNSIGNED PRIMARY KEY, shop_id BIGINT UNSIGNED NOT NULL,
 goods_gross DECIMAL(15,0) NOT NULL, shop_discount DECIMAL(15,0) NOT NULL,
 platform_subsidy DECIMAL(15,0) NOT NULL, goods_net DECIMAL(15,0) NOT NULL,
 vat_included DECIMAL(15,0) NOT NULL, commission DECIMAL(15,0) NOT NULL,
 seller_receivable DECIMAL(15,0) NOT NULL,
 vat_percent DECIMAL(5,2) NOT NULL, commission_percent DECIMAL(5,2) NOT NULL,
 source VARCHAR(20) NOT NULL DEFAULT 'CHECKOUT', created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX ix_finance_shop(shop_id,order_id), FOREIGN KEY(order_id) REFERENCES orders(id)
);
CREATE TABLE IF NOT EXISTS commerce_audit (
 id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT, actor_id BIGINT UNSIGNED NOT NULL,
 action VARCHAR(60) NOT NULL, entity_type VARCHAR(30) NOT NULL, entity_id BIGINT UNSIGNED NOT NULL,
 reason VARCHAR(500) NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX ix_audit_actor(actor_id,created_at)
);
CREATE TABLE IF NOT EXISTS promo_audience (
 campaign_id BIGINT UNSIGNED PRIMARY KEY, audience VARCHAR(20) NOT NULL DEFAULT 'ALL',
 FOREIGN KEY(campaign_id) REFERENCES promo_campaigns(id), CHECK(audience IN ('ALL','NEW_BUYER','RETURNING','SELECTED'))
);
CREATE TABLE IF NOT EXISTS promo_recipients (
 campaign_id BIGINT UNSIGNED NOT NULL, user_id BIGINT UNSIGNED NOT NULL,
 PRIMARY KEY(campaign_id,user_id), FOREIGN KEY(campaign_id) REFERENCES promo_campaigns(id)
);
CREATE TABLE IF NOT EXISTS commerce_refunds (
 order_id BIGINT UNSIGNED PRIMARY KEY, amount DECIMAL(15,0) NOT NULL,
 transaction_reference VARCHAR(120) NOT NULL UNIQUE, recorded_by BIGINT UNSIGNED NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), FOREIGN KEY(order_id) REFERENCES orders(id)
);
