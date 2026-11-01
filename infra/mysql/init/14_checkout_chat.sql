USE order_db;
CREATE TABLE IF NOT EXISTS chat_conversations (
 id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT, shop_id BIGINT UNSIGNED NOT NULL, buyer_id BIGINT UNSIGNED NOT NULL, owner_id BIGINT UNSIGNED NOT NULL,
 buyer_read_id BIGINT UNSIGNED NOT NULL DEFAULT 0,owner_read_id BIGINT UNSIGNED NOT NULL DEFAULT 0, updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY uq_chat_shop_buyer(shop_id,buyer_id),INDEX ix_chat_owner(owner_id,updated_at),INDEX ix_chat_buyer(buyer_id,updated_at)
);
CREATE TABLE IF NOT EXISTS chat_messages (
 id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,conversation_id BIGINT UNSIGNED NOT NULL,sender_id BIGINT UNSIGNED NOT NULL,
 content VARCHAR(2000) NOT NULL,client_key VARCHAR(64) NOT NULL,created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY uq_chat_retry(conversation_id,sender_id,client_key),INDEX ix_chat_cursor(conversation_id,id),FOREIGN KEY(conversation_id) REFERENCES chat_conversations(id)
);
CREATE TABLE IF NOT EXISTS chat_tickets (ticket VARCHAR(64) PRIMARY KEY,user_id BIGINT UNSIGNED NOT NULL,expires_at DATETIME(3) NOT NULL,used BOOLEAN NOT NULL DEFAULT FALSE);
CREATE TABLE IF NOT EXISTS commerce_product_sales (
 product_id BIGINT UNSIGNED PRIMARY KEY,discount_percent DECIMAL(5,2) NOT NULL,created_by BIGINT UNSIGNED NOT NULL,
 starts_at DATETIME(3) NOT NULL,ends_at DATETIME(3) NOT NULL,CHECK(discount_percent>0 AND discount_percent<100)
);
