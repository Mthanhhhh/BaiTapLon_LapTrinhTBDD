-- =====================================================================
-- 01_create_databases_and_users.sql
-- E-Commerce Marketplace | MySQL 8.0+
-- Mỗi microservice có 1 database riêng + 1 user riêng (quyền tối thiểu).
-- ĐỔI MẬT KHẨU trước khi đưa lên VPS!
-- =====================================================================
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS auth_db    CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE IF NOT EXISTS product_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE IF NOT EXISTS order_db   CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE IF NOT EXISTS payment_db CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE USER IF NOT EXISTS 'auth_svc'@'%'    IDENTIFIED BY 'Auth@123456';
CREATE USER IF NOT EXISTS 'product_svc'@'%' IDENTIFIED BY 'Product@123456';
CREATE USER IF NOT EXISTS 'order_svc'@'%'   IDENTIFIED BY 'Order@123456';
CREATE USER IF NOT EXISTS 'payment_svc'@'%' IDENTIFIED BY 'Payment@123456';

GRANT ALL PRIVILEGES ON auth_db.*    TO 'auth_svc'@'%';
GRANT ALL PRIVILEGES ON product_db.* TO 'product_svc'@'%';
GRANT ALL PRIVILEGES ON order_db.*   TO 'order_svc'@'%';
GRANT ALL PRIVILEGES ON payment_db.* TO 'payment_svc'@'%';

FLUSH PRIVILEGES;
