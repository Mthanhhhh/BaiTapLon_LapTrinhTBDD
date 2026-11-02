-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: order_db
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cart_id` bigint unsigned NOT NULL,
  `shop_id` bigint unsigned DEFAULT NULL,
  `product_id` bigint unsigned NOT NULL,
  `sku_id` bigint unsigned DEFAULT NULL,
  `quantity` smallint unsigned NOT NULL DEFAULT '1',
  `is_selected` tinyint(1) NOT NULL DEFAULT '1',
  `added_price` decimal(12,2) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `variant_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cart_sku` (`cart_id`,`sku_id`),
  KEY `idx_cart_shop` (`cart_id`,`shop_id`),
  CONSTRAINT `fk_cart_items_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_cart_qty` CHECK ((`quantity` between 1 and 99))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_carts_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chat_conversations`
--

DROP TABLE IF EXISTS `chat_conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_conversations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `shop_id` bigint unsigned NOT NULL,
  `buyer_id` bigint unsigned NOT NULL,
  `owner_id` bigint unsigned NOT NULL,
  `buyer_read_id` bigint unsigned NOT NULL DEFAULT '0',
  `owner_read_id` bigint unsigned NOT NULL DEFAULT '0',
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_chat_shop_buyer` (`shop_id`,`buyer_id`),
  KEY `ix_chat_owner` (`owner_id`,`updated_at`),
  KEY `ix_chat_buyer` (`buyer_id`,`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint unsigned NOT NULL,
  `sender_id` bigint unsigned NOT NULL,
  `content` varchar(2000) NOT NULL,
  `client_key` varchar(64) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_chat_retry` (`conversation_id`,`sender_id`,`client_key`),
  KEY `ix_chat_cursor` (`conversation_id`,`id`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chat_tickets`
--

DROP TABLE IF EXISTS `chat_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_tickets` (
  `ticket` varchar(64) NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`ticket`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `commerce_audit`
--

DROP TABLE IF EXISTS `commerce_audit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commerce_audit` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `actor_id` bigint unsigned NOT NULL,
  `action` varchar(60) NOT NULL,
  `entity_type` varchar(30) NOT NULL,
  `entity_id` bigint unsigned NOT NULL,
  `reason` varchar(500) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ix_audit_actor` (`actor_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `commerce_finance_policy`
--

DROP TABLE IF EXISTS `commerce_finance_policy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commerce_finance_policy` (
  `shop_id` bigint unsigned NOT NULL,
  `vat_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `commission_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `updated_by` bigint unsigned NOT NULL,
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`shop_id`),
  CONSTRAINT `commerce_finance_policy_chk_1` CHECK ((`vat_percent` between 0 and 100)),
  CONSTRAINT `commerce_finance_policy_chk_2` CHECK ((`commission_percent` between 0 and 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `commerce_order_finance`
--

DROP TABLE IF EXISTS `commerce_order_finance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commerce_order_finance` (
  `order_id` bigint unsigned NOT NULL,
  `shop_id` bigint unsigned NOT NULL,
  `goods_gross` decimal(15,0) NOT NULL,
  `shop_discount` decimal(15,0) NOT NULL,
  `platform_subsidy` decimal(15,0) NOT NULL,
  `goods_net` decimal(15,0) NOT NULL,
  `vat_included` decimal(15,0) NOT NULL,
  `commission` decimal(15,0) NOT NULL,
  `seller_receivable` decimal(15,0) NOT NULL,
  `vat_percent` decimal(5,2) NOT NULL,
  `commission_percent` decimal(5,2) NOT NULL,
  `source` varchar(20) NOT NULL DEFAULT 'CHECKOUT',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`order_id`),
  KEY `ix_finance_shop` (`shop_id`,`order_id`),
  CONSTRAINT `commerce_order_finance_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `commerce_product_sales`
--

DROP TABLE IF EXISTS `commerce_product_sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commerce_product_sales` (
  `product_id` bigint unsigned NOT NULL,
  `discount_percent` decimal(5,2) NOT NULL,
  `created_by` bigint unsigned NOT NULL,
  `starts_at` datetime(3) NOT NULL,
  `ends_at` datetime(3) NOT NULL,
  PRIMARY KEY (`product_id`),
  CONSTRAINT `commerce_product_sales_chk_1` CHECK (((`discount_percent` > 0) and (`discount_percent` < 100)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `commerce_refunds`
--

DROP TABLE IF EXISTS `commerce_refunds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commerce_refunds` (
  `order_id` bigint unsigned NOT NULL,
  `amount` decimal(15,0) NOT NULL,
  `transaction_reference` varchar(120) NOT NULL,
  `recorded_by` bigint unsigned NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`order_id`),
  UNIQUE KEY `transaction_reference` (`transaction_reference`),
  CONSTRAINT `commerce_refunds_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `shipment_id` bigint unsigned DEFAULT NULL,
  `shop_id` bigint unsigned DEFAULT NULL,
  `product_id` bigint unsigned NOT NULL,
  `sku_id` bigint unsigned DEFAULT NULL,
  `product_name` varchar(255) NOT NULL COMMENT 'Snapshot: tên/giá/ảnh tại thời điểm mua',
  `sku_name` varchar(255) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `unit_price` decimal(12,2) DEFAULT NULL,
  `original_price` decimal(12,2) DEFAULT NULL,
  `quantity` smallint unsigned NOT NULL,
  `line_total` decimal(12,2) GENERATED ALWAYS AS ((`unit_price` * `quantity`)) STORED,
  `is_reviewed` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `variant_id` bigint unsigned DEFAULT NULL,
  `variant_name` varchar(255) DEFAULT NULL,
  `price` decimal(12,2) DEFAULT NULL,
  `subtotal` decimal(12,2) DEFAULT NULL,
  `product_image` varchar(500) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_oi_order` (`order_id`),
  KEY `idx_oi_shop` (`shop_id`,`order_id`),
  KEY `idx_oi_sku` (`sku_id`),
  KEY `fk_oi_shipment` (`shipment_id`),
  CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_oi_shipment` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_oi_qty` CHECK (((`quantity` > 0) and (`unit_price` >= 0)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_returns`
--

DROP TABLE IF EXISTS `order_returns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_returns` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `order_item_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `reason` enum('DEFECTIVE','WRONG_ITEM','NOT_AS_DESCRIBED','CHANGED_MIND','OTHER') NOT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `status` enum('REQUESTED','APPROVED','REJECTED','RECEIVED','REFUNDED') NOT NULL DEFAULT 'REQUESTED',
  `refund_amount` decimal(12,2) DEFAULT NULL,
  `requested_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `resolved_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_returns_order` (`order_id`),
  KEY `idx_returns_user` (`user_id`,`status`),
  KEY `fk_returns_item` (`order_item_id`),
  CONSTRAINT `fk_returns_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`),
  CONSTRAINT `fk_returns_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `order_status_history`
--

DROP TABLE IF EXISTS `order_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_status_history` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `from_status` varchar(30) DEFAULT NULL,
  `to_status` varchar(30) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `changed_by` bigint unsigned DEFAULT NULL COMMENT 'NULL = hệ thống',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_osh_order` (`order_id`,`created_at`),
  CONSTRAINT `fk_osh_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_no` varchar(32) DEFAULT NULL,
  `user_id` bigint unsigned NOT NULL,
  `status` enum('PENDING_PAYMENT','WAITING_CONFIRMATION','WAITING_PICKUP','PAID','SHIPPING','DELIVERED','CANCELLED','RETURNED') NOT NULL DEFAULT 'PENDING_PAYMENT',
  `payment_status` enum('UNPAID','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'UNPAID',
  `currency` char(3) NOT NULL DEFAULT 'USD',
  `voucher_id` bigint unsigned DEFAULT NULL,
  `voucher_code` varchar(40) DEFAULT NULL,
  `subtotal_amount` decimal(12,2) DEFAULT NULL,
  `discount_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `tax_rate` decimal(5,4) NOT NULL DEFAULT '0.1000',
  `tax_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `shipping_fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `service_fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(12,2) DEFAULT NULL,
  `payment_method_type` varchar(20) DEFAULT NULL,
  `payment_method_label` varchar(60) DEFAULT NULL COMMENT 'vd VISA ****2334',
  `shipping_method_code` varchar(20) NOT NULL DEFAULT 'STANDARD',
  `recipient_name` varchar(120) DEFAULT NULL,
  `recipient_phone` varchar(20) DEFAULT NULL,
  `ship_country` char(2) NOT NULL DEFAULT 'VN',
  `ship_province` varchar(100) DEFAULT NULL,
  `ship_district` varchar(100) DEFAULT NULL,
  `ship_ward` varchar(100) DEFAULT NULL,
  `ship_address_line` varchar(255) DEFAULT NULL,
  `ship_postal_code` varchar(20) DEFAULT NULL,
  `note` varchar(500) DEFAULT NULL,
  `cancel_reason` varchar(255) DEFAULT NULL,
  `idempotency_key` varchar(64) DEFAULT NULL,
  `expires_at` datetime(3) DEFAULT NULL COMMENT 'Hết hạn thanh toán -> tự huỷ, nhả kho',
  `paid_at` datetime(3) DEFAULT NULL,
  `shipped_at` datetime(3) DEFAULT NULL,
  `delivered_at` datetime(3) DEFAULT NULL,
  `cancelled_at` datetime(3) DEFAULT NULL,
  `version` bigint NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `subtotal` decimal(12,2) DEFAULT NULL,
  `discount` decimal(12,2) DEFAULT '0.00',
  `tax` decimal(12,2) DEFAULT NULL,
  `fees` decimal(12,2) DEFAULT '0.00',
  `total` decimal(12,2) DEFAULT NULL,
  `shipping_name` varchar(255) DEFAULT NULL,
  `shipping_phone` varchar(50) DEFAULT NULL,
  `shipping_street` varchar(255) DEFAULT NULL,
  `shipping_city` varchar(100) DEFAULT NULL,
  `shipping_country` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_orders_no` (`order_no`),
  UNIQUE KEY `uk_orders_idem` (`user_id`,`idempotency_key`),
  KEY `idx_orders_user` (`user_id`,`created_at`),
  KEY `idx_orders_status` (`status`,`created_at`),
  KEY `idx_orders_expires` (`status`,`expires_at`),
  KEY `fk_orders_voucher` (`voucher_id`),
  CONSTRAINT `fk_orders_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_orders_money` CHECK (((`subtotal_amount` >= 0) and (`discount_amount` >= 0) and (`discount_amount` <= `subtotal_amount`))),
  CONSTRAINT `chk_orders_total` CHECK ((`total_amount` = ((((`subtotal_amount` - `discount_amount`) + `tax_amount`) + `shipping_fee`) + `service_fee`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `outbox_events`
--

DROP TABLE IF EXISTS `outbox_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `outbox_events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_id` char(36) NOT NULL,
  `aggregate_type` varchar(50) NOT NULL,
  `aggregate_id` varchar(64) NOT NULL,
  `event_type` varchar(100) NOT NULL,
  `topic` varchar(100) NOT NULL,
  `payload` json NOT NULL,
  `status` enum('PENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING',
  `retry_count` tinyint unsigned NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `sent_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_outbox_event` (`event_id`),
  KEY `idx_outbox_status` (`status`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `processed_events`
--

DROP TABLE IF EXISTS `processed_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `processed_events` (
  `event_id` char(36) NOT NULL,
  `consumer` varchar(100) NOT NULL,
  `processed_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`event_id`,`consumer`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promo_audience`
--

DROP TABLE IF EXISTS `promo_audience`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promo_audience` (
  `campaign_id` bigint unsigned NOT NULL,
  `audience` varchar(20) NOT NULL DEFAULT 'ALL',
  PRIMARY KEY (`campaign_id`),
  CONSTRAINT `promo_audience_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `promo_campaigns` (`id`),
  CONSTRAINT `promo_audience_chk_1` CHECK ((`audience` in (_utf8mb4'ALL',_utf8mb4'NEW_BUYER',_utf8mb4'RETURNING',_utf8mb4'SELECTED')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promo_campaigns`
--

DROP TABLE IF EXISTS `promo_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promo_campaigns` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `kind` varchar(12) NOT NULL,
  `layer` varchar(12) NOT NULL,
  `shop_id` bigint unsigned DEFAULT NULL,
  `code` varchar(40) DEFAULT NULL,
  `discount_type` varchar(12) NOT NULL DEFAULT 'FIXED',
  `value` decimal(12,2) NOT NULL DEFAULT '0.00',
  `min_order` decimal(12,2) NOT NULL DEFAULT '0.00',
  `max_discount` decimal(12,2) DEFAULT NULL,
  `budget_total` decimal(15,2) NOT NULL,
  `budget_reserved` decimal(15,2) NOT NULL DEFAULT '0.00',
  `budget_spent` decimal(15,2) NOT NULL DEFAULT '0.00',
  `quota_total` int NOT NULL,
  `quota_reserved` int NOT NULL DEFAULT '0',
  `quota_used` int NOT NULL DEFAULT '0',
  `per_user_limit` int NOT NULL DEFAULT '1',
  `stackable` tinyint(1) NOT NULL DEFAULT '1',
  `starts_at` datetime(3) NOT NULL,
  `ends_at` datetime(3) NOT NULL,
  `status` varchar(12) NOT NULL DEFAULT 'ACTIVE',
  `created_by` bigint unsigned NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `ix_promo_window` (`status`,`starts_at`,`ends_at`),
  CONSTRAINT `promo_campaigns_chk_1` CHECK (((`quota_reserved` >= 0) and (`quota_used` >= 0) and ((`quota_reserved` + `quota_used`) <= `quota_total`))),
  CONSTRAINT `promo_campaigns_chk_2` CHECK (((`budget_reserved` >= 0) and (`budget_spent` >= 0) and ((`budget_reserved` + `budget_spent`) <= `budget_total`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promo_consumed_events`
--

DROP TABLE IF EXISTS `promo_consumed_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promo_consumed_events` (
  `event_id` varchar(36) NOT NULL,
  `consumer_name` varchar(40) NOT NULL,
  `processed_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`event_id`,`consumer_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promo_flash_items`
--

DROP TABLE IF EXISTS `promo_flash_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promo_flash_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `campaign_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `sku_id` bigint unsigned NOT NULL,
  `sale_price` decimal(12,2) NOT NULL,
  `quota_total` int NOT NULL,
  `quota_reserved` int NOT NULL DEFAULT '0',
  `quota_used` int NOT NULL DEFAULT '0',
  `per_user_limit` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_flash_sku` (`campaign_id`,`sku_id`),
  KEY `ix_flash_sku` (`sku_id`),
  CONSTRAINT `promo_flash_items_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `promo_campaigns` (`id`),
  CONSTRAINT `promo_flash_items_chk_1` CHECK (((`quota_reserved` >= 0) and (`quota_used` >= 0) and ((`quota_reserved` + `quota_used`) <= `quota_total`)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promo_flash_reservations`
--

DROP TABLE IF EXISTS `promo_flash_reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promo_flash_reservations` (
  `order_id` bigint unsigned NOT NULL,
  `flash_item_id` bigint unsigned NOT NULL,
  `quantity` int NOT NULL,
  PRIMARY KEY (`order_id`,`flash_item_id`),
  KEY `flash_item_id` (`flash_item_id`),
  CONSTRAINT `promo_flash_reservations_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `promo_reservations` (`order_id`),
  CONSTRAINT `promo_flash_reservations_ibfk_2` FOREIGN KEY (`flash_item_id`) REFERENCES `promo_flash_items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promo_outbox`
--

DROP TABLE IF EXISTS `promo_outbox`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promo_outbox` (
  `event_id` varchar(36) NOT NULL,
  `type` varchar(50) NOT NULL,
  `payload` json NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `published_at` datetime(3) DEFAULT NULL,
  `claimed_until` datetime(3) DEFAULT NULL,
  `attempts` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`event_id`),
  KEY `ix_outbox_pending` (`published_at`,`claimed_until`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promo_recipients`
--

DROP TABLE IF EXISTS `promo_recipients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promo_recipients` (
  `campaign_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`campaign_id`,`user_id`),
  CONSTRAINT `promo_recipients_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `promo_campaigns` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promo_redemptions`
--

DROP TABLE IF EXISTS `promo_redemptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promo_redemptions` (
  `order_id` bigint unsigned NOT NULL,
  `campaign_id` bigint unsigned NOT NULL,
  `discount_amount` decimal(12,2) NOT NULL,
  PRIMARY KEY (`order_id`,`campaign_id`),
  KEY `campaign_id` (`campaign_id`),
  CONSTRAINT `promo_redemptions_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `promo_reservations` (`order_id`),
  CONSTRAINT `promo_redemptions_ibfk_2` FOREIGN KEY (`campaign_id`) REFERENCES `promo_campaigns` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promo_reminders`
--

DROP TABLE IF EXISTS `promo_reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promo_reminders` (
  `user_id` bigint unsigned NOT NULL,
  `campaign_id` bigint unsigned NOT NULL,
  `sent_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`user_id`,`campaign_id`),
  KEY `campaign_id` (`campaign_id`),
  CONSTRAINT `promo_reminders_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `promo_campaigns` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promo_reservations`
--

DROP TABLE IF EXISTS `promo_reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promo_reservations` (
  `order_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `state` varchar(12) NOT NULL,
  `expires_at` datetime(3) DEFAULT NULL,
  `pricing_snapshot` json NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`order_id`),
  KEY `ix_reservation_expiry` (`state`,`expires_at`),
  CONSTRAINT `promo_reservations_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promo_shipping_policy`
--

DROP TABLE IF EXISTS `promo_shipping_policy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promo_shipping_policy` (
  `shop_id` bigint unsigned NOT NULL,
  `fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`shop_id`),
  CONSTRAINT `promo_shipping_policy_chk_1` CHECK ((`fee` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `promo_wallet`
--

DROP TABLE IF EXISTS `promo_wallet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promo_wallet` (
  `user_id` bigint unsigned NOT NULL,
  `campaign_id` bigint unsigned NOT NULL,
  `saved_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`,`campaign_id`),
  KEY `campaign_id` (`campaign_id`),
  CONSTRAINT `promo_wallet_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `promo_campaigns` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shipments`
--

DROP TABLE IF EXISTS `shipments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `shop_id` bigint unsigned NOT NULL,
  `shipping_method_code` varchar(20) NOT NULL,
  `carrier` varchar(60) DEFAULT NULL,
  `tracking_no` varchar(64) DEFAULT NULL,
  `status` enum('PENDING','PACKED','SHIPPING','DELIVERED','FAILED','RETURNED') NOT NULL DEFAULT 'PENDING',
  `shipping_fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `estimated_delivery_at` datetime(3) DEFAULT NULL,
  `shipped_at` datetime(3) DEFAULT NULL,
  `delivered_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_shipments` (`order_id`,`shop_id`),
  KEY `idx_shipments_tracking` (`tracking_no`),
  KEY `idx_shipments_shop` (`shop_id`,`status`),
  CONSTRAINT `fk_shipments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shipping_methods`
--

DROP TABLE IF EXISTS `shipping_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipping_methods` (
  `id` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `name` varchar(60) NOT NULL,
  `min_delivery_hours` int unsigned NOT NULL,
  `max_delivery_hours` int unsigned NOT NULL,
  `base_fee` decimal(12,2) NOT NULL DEFAULT '0.00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_shipping_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_vouchers`
--

DROP TABLE IF EXISTS `user_vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_vouchers` (
  `user_id` bigint unsigned NOT NULL,
  `voucher_id` bigint unsigned NOT NULL,
  `collected_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`,`voucher_id`),
  KEY `fk_uv_voucher` (`voucher_id`),
  CONSTRAINT `fk_uv_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Ví voucher đã lưu';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `voucher_usages`
--

DROP TABLE IF EXISTS `voucher_usages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `voucher_usages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `voucher_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `order_id` bigint unsigned NOT NULL,
  `discount_amount` decimal(12,2) NOT NULL,
  `used_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_vu_order` (`order_id`) COMMENT 'Mỗi đơn tối đa 1 voucher',
  KEY `idx_vu_user` (`voucher_id`,`user_id`),
  CONSTRAINT `fk_vu_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_vu_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `vouchers`
--

DROP TABLE IF EXISTS `vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vouchers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(40) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `scope` enum('PLATFORM','SHOP') NOT NULL DEFAULT 'PLATFORM',
  `shop_id` bigint unsigned DEFAULT NULL,
  `discount_type` enum('PERCENT','FIXED') NOT NULL,
  `discount_value` decimal(12,2) NOT NULL,
  `max_discount_amount` decimal(12,2) DEFAULT NULL COMMENT 'Trần giảm khi dùng PERCENT',
  `min_order_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_quantity` int unsigned NOT NULL,
  `used_quantity` int unsigned NOT NULL DEFAULT '0',
  `per_user_limit` tinyint unsigned NOT NULL DEFAULT '1',
  `starts_at` datetime(3) NOT NULL,
  `ends_at` datetime(3) NOT NULL,
  `status` enum('ACTIVE','PAUSED','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
  `version` bigint NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_vouchers_code` (`code`),
  KEY `idx_vouchers_active` (`status`,`starts_at`,`ends_at`),
  CONSTRAINT `chk_voucher_percent` CHECK (((`discount_type` <> _utf8mb4'PERCENT') or (`discount_value` <= 100))),
  CONSTRAINT `chk_voucher_time` CHECK ((`ends_at` > `starts_at`)),
  CONSTRAINT `chk_voucher_used` CHECK ((`used_quantity` <= `total_quantity`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-02 14:16:51
