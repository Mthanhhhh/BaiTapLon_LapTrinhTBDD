-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: product_db
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
-- Table structure for table `banners`
--

DROP TABLE IF EXISTS `banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banners` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `subtitle` varchar(150) DEFAULT NULL,
  `image_url` varchar(500) NOT NULL,
  `background_color` char(7) DEFAULT NULL,
  `cta_text` varchar(40) DEFAULT NULL,
  `link_type` enum('PRODUCT','CATEGORY','FLASH_SALE','URL') NOT NULL,
  `link_target` varchar(255) NOT NULL,
  `position` enum('HOME_HERO','HOME_GRID','CATEGORY_TOP') NOT NULL,
  `badge_text` varchar(20) DEFAULT NULL COMMENT 'vd 30%',
  `sort_order` smallint NOT NULL DEFAULT '0',
  `starts_at` datetime(3) DEFAULT NULL,
  `ends_at` datetime(3) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_banners_pos` (`position`,`is_active`,`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `brands`
--

DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brands` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_brands_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `catalog_source_shop_categories`
--

DROP TABLE IF EXISTS `catalog_source_shop_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `catalog_source_shop_categories` (
  `source_shop_id` bigint unsigned NOT NULL,
  `category_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`source_shop_id`,`category_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `catalog_source_shop_categories_ibfk_1` FOREIGN KEY (`source_shop_id`) REFERENCES `catalog_source_shops` (`id`),
  CONSTRAINT `catalog_source_shop_categories_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `catalog_source_shops`
--

DROP TABLE IF EXISTS `catalog_source_shops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `catalog_source_shops` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `provider` varchar(60) NOT NULL,
  `source_url` varchar(500) NOT NULL,
  `status` varchar(40) NOT NULL,
  `checked_at` datetime(3) NOT NULL,
  `note` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `source_url` (`source_url`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `parent_id` bigint unsigned DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `icon_url` varchar(500) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `theme_color` char(7) DEFAULT NULL COMMENT 'Màu nền vòng tròn danh mục trên Home',
  `level` tinyint unsigned NOT NULL DEFAULT '1',
  `path` varchar(255) NOT NULL DEFAULT '/' COMMENT 'Materialized path, vd /1/14/',
  `sort_order` smallint NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_categories_slug` (`slug`),
  KEY `idx_categories_parent` (`parent_id`,`sort_order`),
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `classroom_catalog_history`
--

DROP TABLE IF EXISTS `classroom_catalog_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classroom_catalog_history` (
  `product_id` bigint unsigned NOT NULL,
  `seeded_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `classroom_catalog_products`
--

DROP TABLE IF EXISTS `classroom_catalog_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classroom_catalog_products` (
  `source_key` char(64) NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `brand_key` varchar(100) NOT NULL,
  `source_url` varchar(1000) NOT NULL,
  `checked_at` datetime(3) NOT NULL,
  PRIMARY KEY (`source_key`),
  UNIQUE KEY `product_id` (`product_id`),
  KEY `brand_key` (`brand_key`),
  CONSTRAINT `classroom_catalog_products_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `classroom_catalog_products_ibfk_2` FOREIGN KEY (`brand_key`) REFERENCES `classroom_catalog_shops` (`brand_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `classroom_catalog_shops`
--

DROP TABLE IF EXISTS `classroom_catalog_shops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classroom_catalog_shops` (
  `brand_key` varchar(100) NOT NULL,
  `shop_id` bigint unsigned NOT NULL,
  `source_url` varchar(500) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`brand_key`),
  UNIQUE KEY `shop_id` (`shop_id`),
  CONSTRAINT `classroom_catalog_shops_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `favorites`
--

DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorites` (
  `user_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`,`product_id`),
  KEY `idx_fav_product` (`product_id`),
  CONSTRAINT `fk_fav_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feedback_tags`
--

DROP TABLE IF EXISTS `feedback_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback_tags` (
  `id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(30) NOT NULL,
  `name` varchar(60) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ft_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `flash_sale_items`
--

DROP TABLE IF EXISTS `flash_sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flash_sale_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `flash_sale_id` bigint unsigned NOT NULL,
  `sku_id` bigint unsigned NOT NULL,
  `sale_price` decimal(12,2) NOT NULL,
  `quota` int unsigned NOT NULL,
  `sold` int unsigned NOT NULL DEFAULT '0',
  `limit_per_user` tinyint unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_fsi` (`flash_sale_id`,`sku_id`),
  KEY `fk_fsi_sku` (`sku_id`),
  CONSTRAINT `fk_fsi_sale` FOREIGN KEY (`flash_sale_id`) REFERENCES `flash_sales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fsi_sku` FOREIGN KEY (`sku_id`) REFERENCES `product_skus` (`id`),
  CONSTRAINT `chk_fsi_sold` CHECK ((`sold` <= `quota`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `flash_sales`
--

DROP TABLE IF EXISTS `flash_sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flash_sales` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(150) NOT NULL,
  `banner_url` varchar(500) DEFAULT NULL,
  `starts_at` datetime(3) NOT NULL,
  `ends_at` datetime(3) NOT NULL,
  `status` enum('SCHEDULED','RUNNING','ENDED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_fs_status` (`status`,`starts_at`),
  CONSTRAINT `chk_fs_time` CHECK ((`ends_at` > `starts_at`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inventory_movements`
--

DROP TABLE IF EXISTS `inventory_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_movements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sku_id` bigint unsigned NOT NULL,
  `delta` int NOT NULL COMMENT 'Âm = xuất, dương = nhập',
  `stock_after` int unsigned NOT NULL,
  `reason` enum('INITIAL','RESERVE','RELEASE','RETURN','ADJUST') NOT NULL,
  `reference_type` varchar(30) DEFAULT NULL,
  `reference_id` varchar(64) DEFAULT NULL COMMENT 'vd order_no',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_im_sku` (`sku_id`,`created_at`),
  KEY `idx_im_ref` (`reference_type`,`reference_id`),
  CONSTRAINT `fk_im_sku` FOREIGN KEY (`sku_id`) REFERENCES `product_skus` (`id`)
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
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `option_value_id` bigint unsigned DEFAULT NULL COMMENT 'Ảnh theo màu',
  `url` varchar(500) NOT NULL,
  `sort_order` smallint NOT NULL DEFAULT '0',
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_images_product` (`product_id`,`sort_order`),
  KEY `fk_images_value` (`option_value_id`),
  CONSTRAINT `fk_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_images_value` FOREIGN KEY (`option_value_id`) REFERENCES `product_option_values` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_option_values`
--

DROP TABLE IF EXISTS `product_option_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_option_values` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `option_id` bigint unsigned NOT NULL,
  `value` varchar(80) NOT NULL,
  `color_hex` char(7) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `sort_order` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_option_values` (`option_id`,`value`),
  CONSTRAINT `fk_ov_option` FOREIGN KEY (`option_id`) REFERENCES `product_options` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_options`
--

DROP TABLE IF EXISTS `product_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_options` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `name` varchar(50) NOT NULL COMMENT 'Color, Size...',
  `sort_order` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_options` (`product_id`,`name`),
  CONSTRAINT `fk_options_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_promo_subscriptions`
--

DROP TABLE IF EXISTS `product_promo_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_promo_subscriptions` (
  `user_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`user_id`,`product_id`),
  KEY `fk_pps_product` (`product_id`),
  CONSTRAINT `fk_pps_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Toggle Notify me of promotions';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_rating_stats`
--

DROP TABLE IF EXISTS `product_rating_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_rating_stats` (
  `product_id` bigint unsigned NOT NULL,
  `count_1` int unsigned NOT NULL DEFAULT '0',
  `count_2` int unsigned NOT NULL DEFAULT '0',
  `count_3` int unsigned NOT NULL DEFAULT '0',
  `count_4` int unsigned NOT NULL DEFAULT '0',
  `count_5` int unsigned NOT NULL DEFAULT '0',
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`product_id`),
  CONSTRAINT `fk_prs_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_shipping_options`
--

DROP TABLE IF EXISTS `product_shipping_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_shipping_options` (
  `product_id` bigint unsigned NOT NULL,
  `method_code` enum('INSTANT','EXPRESS','STANDARD') NOT NULL,
  PRIMARY KEY (`product_id`,`method_code`),
  KEY `idx_pso_method` (`method_code`),
  CONSTRAINT `fk_pso_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `product_skus`
--

DROP TABLE IF EXISTS `product_skus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_skus` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `sku_code` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL COMMENT 'vd Blue / M',
  `price` decimal(12,2) NOT NULL,
  `original_price` decimal(12,2) DEFAULT NULL,
  `stock_quantity` int unsigned NOT NULL DEFAULT '0' COMMENT 'Tồn khả dụng; giữ chỗ sẽ trừ ngay',
  `sold_count` int unsigned NOT NULL DEFAULT '0',
  `status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `version` bigint NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sku_code` (`sku_code`),
  KEY `idx_sku_product` (`product_id`,`status`),
  CONSTRAINT `fk_sku_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `chk_sku_price` CHECK ((`price` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `shop_id` bigint unsigned NOT NULL,
  `category_id` bigint unsigned NOT NULL,
  `brand_id` bigint unsigned DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(280) NOT NULL,
  `short_description` varchar(500) DEFAULT NULL,
  `description` text,
  `thumbnail_url` varchar(500) DEFAULT NULL,
  `currency` char(3) NOT NULL DEFAULT 'USD',
  `min_price` decimal(12,2) NOT NULL,
  `max_price` decimal(12,2) NOT NULL,
  `original_price` decimal(12,2) DEFAULT NULL COMMENT 'Giá gốc để hiện giảm giá',
  `discount_percent` tinyint unsigned NOT NULL DEFAULT '0',
  `promo_label` varchar(60) DEFAULT NULL COMMENT 'vd Buy 1 get 1',
  `attributes` json DEFAULT NULL COMMENT 'Thuộc tính linh hoạt: xuất xứ, cấu hình...',
  `weight_grams` int unsigned DEFAULT NULL,
  `has_free_return_30d` tinyint(1) NOT NULL DEFAULT '0',
  `has_buyer_protection` tinyint(1) NOT NULL DEFAULT '0',
  `is_best_deal` tinyint(1) NOT NULL DEFAULT '0',
  `supports_ship_to_store` tinyint(1) NOT NULL DEFAULT '0',
  `rating_avg` decimal(3,2) NOT NULL DEFAULT '0.00',
  `rating_count` int unsigned NOT NULL DEFAULT '0',
  `sold_count` int unsigned NOT NULL DEFAULT '0',
  `view_count` int unsigned NOT NULL DEFAULT '0',
  `favorite_count` int unsigned NOT NULL DEFAULT '0',
  `status` enum('DRAFT','ACTIVE','HIDDEN','BANNED') NOT NULL DEFAULT 'DRAFT',
  `version` bigint NOT NULL DEFAULT '0' COMMENT 'Optimistic lock (@Version)',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_products_slug` (`slug`),
  KEY `idx_products_cat_sold` (`category_id`,`status`,`sold_count`),
  KEY `idx_products_cat_price` (`category_id`,`status`,`min_price`),
  KEY `idx_products_cat_rating` (`category_id`,`status`,`rating_avg`),
  KEY `idx_products_shop` (`shop_id`,`status`),
  KEY `idx_products_status_new` (`status`,`created_at`),
  KEY `fk_products_brand` (`brand_id`),
  FULLTEXT KEY `ft_products_name` (`name`) /*!50100 WITH PARSER `ngram` */ ,
  CONSTRAINT `fk_products_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `fk_products_shop` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`),
  CONSTRAINT `chk_products_price` CHECK (((`min_price` >= 0) and (`max_price` >= `min_price`))),
  CONSTRAINT `chk_products_rating` CHECK ((`rating_avg` between 0 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `review_images`
--

DROP TABLE IF EXISTS `review_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_images` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `review_id` bigint unsigned NOT NULL,
  `url` varchar(500) NOT NULL,
  `sort_order` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_ri_review` (`review_id`),
  CONSTRAINT `fk_ri_review` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `review_tags`
--

DROP TABLE IF EXISTS `review_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_tags` (
  `review_id` bigint unsigned NOT NULL,
  `tag_id` smallint unsigned NOT NULL,
  PRIMARY KEY (`review_id`,`tag_id`),
  KEY `fk_rt_tag` (`tag_id`),
  CONSTRAINT `fk_rt_review` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rt_tag` FOREIGN KEY (`tag_id`) REFERENCES `feedback_tags` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `sku_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned NOT NULL COMMENT 'auth_db.users.id',
  `order_id` bigint unsigned NOT NULL COMMENT 'order_db.orders.id',
  `order_item_id` bigint unsigned NOT NULL COMMENT 'order_db.order_items.id',
  `reviewer_name` varchar(120) NOT NULL COMMENT 'Snapshot để khỏi gọi sang auth',
  `reviewer_avatar_url` varchar(500) DEFAULT NULL,
  `rating` tinyint unsigned NOT NULL,
  `sentiment` enum('BAD','NEUTRAL','GOOD') DEFAULT NULL COMMENT '3 emoji ở màn Feedback',
  `content` text,
  `is_anonymous` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('VISIBLE','HIDDEN','PENDING') NOT NULL DEFAULT 'VISIBLE',
  `like_count` int unsigned NOT NULL DEFAULT '0',
  `seller_reply` text,
  `seller_replied_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_reviews_item` (`order_item_id`,`user_id`) COMMENT 'Mỗi món 1 review',
  KEY `idx_reviews_product` (`product_id`,`status`,`created_at`),
  KEY `idx_reviews_rating` (`product_id`,`rating`),
  KEY `idx_reviews_user` (`user_id`),
  CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `chk_reviews_rating` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shop_business_profiles`
--

DROP TABLE IF EXISTS `shop_business_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_business_profiles` (
  `shop_id` bigint unsigned NOT NULL,
  `profile_json` json NOT NULL,
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`shop_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shop_category_links`
--

DROP TABLE IF EXISTS `shop_category_links`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_category_links` (
  `shop_id` bigint unsigned NOT NULL,
  `category_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`shop_id`,`category_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `shop_category_links_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`),
  CONSTRAINT `shop_category_links_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shop_collection_products`
--

DROP TABLE IF EXISTS `shop_collection_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_collection_products` (
  `collection_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`collection_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `shop_collection_products_ibfk_1` FOREIGN KEY (`collection_id`) REFERENCES `shop_collections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `shop_collection_products_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shop_collections`
--

DROP TABLE IF EXISTS `shop_collections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_collections` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `shop_id` bigint unsigned NOT NULL,
  `name` varchar(100) NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `shop_id` (`shop_id`),
  CONSTRAINT `shop_collections_ibfk_1` FOREIGN KEY (`shop_id`) REFERENCES `shops` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `shops`
--

DROP TABLE IF EXISTS `shops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shops` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `owner_user_id` bigint unsigned NOT NULL COMMENT 'auth_db.users.id',
  `name` varchar(150) NOT NULL,
  `slug` varchar(170) NOT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `banner_url` varchar(500) DEFAULT NULL,
  `description` text,
  `province` varchar(100) DEFAULT NULL,
  `is_authorized` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Authorized shop',
  `rating_avg` decimal(3,2) NOT NULL DEFAULT '0.00',
  `rating_count` int unsigned NOT NULL DEFAULT '0',
  `follower_count` int unsigned NOT NULL DEFAULT '0',
  `status` enum('PENDING','ACTIVE','SUSPENDED') NOT NULL DEFAULT 'PENDING',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_shops_slug` (`slug`),
  UNIQUE KEY `uk_shops_owner` (`owner_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sku_option_values`
--

DROP TABLE IF EXISTS `sku_option_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sku_option_values` (
  `sku_id` bigint unsigned NOT NULL,
  `option_value_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`sku_id`,`option_value_id`),
  KEY `idx_sov_value` (`option_value_id`),
  CONSTRAINT `fk_sov_sku` FOREIGN KEY (`sku_id`) REFERENCES `product_skus` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sov_value` FOREIGN KEY (`option_value_id`) REFERENCES `product_option_values` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `stock_reservations`
--

DROP TABLE IF EXISTS `stock_reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_reservations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL COMMENT 'order_db.orders.id',
  `order_no` varchar(32) NOT NULL,
  `sku_id` bigint unsigned NOT NULL,
  `quantity` int unsigned NOT NULL,
  `status` enum('HELD','COMMITTED','RELEASED','EXPIRED') NOT NULL DEFAULT 'HELD',
  `expires_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_resv` (`order_no`,`sku_id`) COMMENT 'Idempotent khi Kafka gửi trùng',
  KEY `idx_resv_sweep` (`status`,`expires_at`),
  KEY `fk_resv_sku` (`sku_id`),
  CONSTRAINT `fk_resv_sku` FOREIGN KEY (`sku_id`) REFERENCES `product_skus` (`id`),
  CONSTRAINT `chk_resv_qty` CHECK ((`quantity` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_product_views`
--

DROP TABLE IF EXISTS `user_product_views`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_product_views` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `product_id` bigint unsigned NOT NULL,
  `viewed_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_upv_user` (`user_id`,`viewed_at`),
  KEY `idx_upv_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Dữ liệu cho Recommended for you';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-02 14:16:50
