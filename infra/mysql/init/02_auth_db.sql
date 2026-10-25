-- =====================================================================
-- 02_auth_db.sql | auth-service
-- Users, roles, địa chỉ, refresh token, thông báo (Inbox), push token
-- =====================================================================
USE auth_db;
SET NAMES utf8mb4;

CREATE TABLE roles (
  id    TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code  VARCHAR(30) NOT NULL,
  name  VARCHAR(60) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_roles_code (code)
) ENGINE=InnoDB;

CREATE TABLE users (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email              VARCHAR(255) NOT NULL,
  phone              VARCHAR(20)  NULL,
  password_hash      VARCHAR(100) NOT NULL COMMENT 'BCrypt',
  full_name          VARCHAR(120) NOT NULL,
  avatar_url         VARCHAR(500) NULL,
  gender             ENUM('MALE','FEMALE','OTHER') NULL,
  birth_date         DATE NULL,
  status             ENUM('ACTIVE','LOCKED','DELETED') NOT NULL DEFAULT 'ACTIVE',
  email_verified_at  DATETIME(3) NULL,
  phone_verified_at  DATETIME(3) NULL,
  failed_login_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
  locked_until       DATETIME(3) NULL,
  last_login_at      DATETIME(3) NULL,
  created_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at         DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email),
  UNIQUE KEY uk_users_phone (phone),
  KEY idx_users_status (status)
) ENGINE=InnoDB;

CREATE TABLE user_roles (
  user_id BIGINT UNSIGNED  NOT NULL,
  role_id TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE TABLE user_addresses (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  label          ENUM('HOME','OFFICE','OTHER') NOT NULL DEFAULT 'HOME',
  recipient_name VARCHAR(120) NOT NULL,
  phone          VARCHAR(20)  NOT NULL,
  country_code   CHAR(2) NOT NULL DEFAULT 'VN',
  province       VARCHAR(100) NOT NULL,
  district       VARCHAR(100) NOT NULL,
  ward           VARCHAR(100) NULL,
  address_line   VARCHAR(255) NOT NULL,
  postal_code    VARCHAR(20)  NULL,
  latitude       DECIMAL(9,6) NULL,
  longitude      DECIMAL(9,6) NULL,
  is_default     TINYINT(1) NOT NULL DEFAULT 0,
  created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at     DATETIME(3) NULL,
  PRIMARY KEY (id),
  KEY idx_addr_user (user_id, is_default),
  CONSTRAINT fk_addr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE refresh_tokens (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  token_hash  CHAR(64) NOT NULL COMMENT 'SHA-256 của token, không lưu token gốc',
  device_info VARCHAR(255) NULL,
  ip_address  VARCHAR(45)  NULL,
  expires_at  DATETIME(3) NOT NULL,
  revoked_at  DATETIME(3) NULL,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_rt_hash (token_hash),
  KEY idx_rt_user (user_id),
  KEY idx_rt_expires (expires_at),
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Inbox (tab Inbox + badge số thông báo chưa đọc)
CREATE TABLE user_notifications (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  type       ENUM('ORDER','PROMOTION','REVIEW','SYSTEM') NOT NULL,
  title      VARCHAR(200) NOT NULL,
  body       VARCHAR(500) NULL,
  data       JSON NULL COMMENT 'vd {"orderNo":"EC...","screen":"OrderDetail"}',
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  read_at    DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_notif_user (user_id, is_read, created_at),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE notification_settings (
  user_id        BIGINT UNSIGNED NOT NULL,
  push_enabled   TINYINT(1) NOT NULL DEFAULT 1,
  order_updates  TINYINT(1) NOT NULL DEFAULT 1,
  promotions     TINYINT(1) NOT NULL DEFAULT 0,
  updated_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id),
  CONSTRAINT fk_ns_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE device_tokens (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  platform   ENUM('ANDROID','IOS') NOT NULL,
  token      VARCHAR(255) NOT NULL COMMENT 'Expo/FCM push token',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_device_token (token),
  KEY idx_device_user (user_id),
  CONSTRAINT fk_device_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
