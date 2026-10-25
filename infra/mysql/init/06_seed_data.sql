-- =====================================================================
-- 06_seed_data.sql | Dữ liệu mẫu bám theo UI (Electronics, Fashion, Beauty,
-- Fresh Fruits, Headphone $59, Hoodie $2.99 Buy 1 get 1, voucher, Visa/Maestro/PayPal)
-- Chạy SAU 01..05. Ảnh là đường dẫn giả: /images/... (thay bằng ảnh thật/CDN).
-- LƯU Ý: password_hash là CHỖ GIỮ CHỖ. Hãy tạo user qua API đăng ký, hoặc
-- UPDATE users SET password_hash = '<hash BCrypt thật>' (xem hướng dẫn).
-- =====================================================================
SET NAMES utf8mb4;

-- ======================= auth_db =======================
USE auth_db;

INSERT INTO roles (id, code, name) VALUES (1,'BUYER','Buyer'),(2,'SELLER','Seller'),(3,'ADMIN','Admin');

INSERT INTO users (id, email, phone, password_hash, full_name, status, email_verified_at) VALUES
(1,'admin@ecommerce.local', '0900000001','$2a$10$REPLACE_WITH_REAL_BCRYPT_HASH','Admin','ACTIVE',NOW(3)),
(2,'seller@ecommerce.local','0900000002','$2a$10$REPLACE_WITH_REAL_BCRYPT_HASH','TechZone Seller','ACTIVE',NOW(3)),
(3,'buyer@ecommerce.local', '0900000003','$2a$10$REPLACE_WITH_REAL_BCRYPT_HASH','Buyer Demo','ACTIVE',NOW(3)),
(4,'seller2@ecommerce.local','0900000004','$2a$10$REPLACE_WITH_REAL_BCRYPT_HASH','Daily Mart Seller','ACTIVE',NOW(3)),
(5,'jevon@ecommerce.local', '0900000005','$2a$10$REPLACE_WITH_REAL_BCRYPT_HASH','Jevon Raynor','ACTIVE',NOW(3)),
(6,'jason@ecommerce.local', '0900000006','$2a$10$REPLACE_WITH_REAL_BCRYPT_HASH','Jason D.','ACTIVE',NOW(3));

INSERT INTO user_roles (user_id, role_id) VALUES (1,3),(2,2),(3,1),(4,2),(5,1),(6,1);

INSERT INTO notification_settings (user_id) SELECT id FROM users;

INSERT INTO user_addresses (user_id, label, recipient_name, phone, province, district, ward, address_line, is_default)
VALUES (3,'HOME','Buyer Demo','0900000003','Ho Chi Minh City','District 1','Ben Nghe Ward','12 Nguyen Hue',1);

INSERT INTO user_notifications (user_id, type, title, body, data) VALUES
(3,'ORDER','Order delivered','Your order EC20260915000001 has been delivered.','{"orderNo":"EC20260915000001"}'),
(3,'PROMOTION','Weekend Flash Sale','Up to 50% off shoes and tablets.','{"screen":"FlashSale"}');

-- ======================= product_db =======================
USE product_db;

INSERT INTO shops (id, owner_user_id, name, slug, is_authorized, rating_avg, rating_count, status, province) VALUES
(1,2,'TechZone Official','techzone-official',1,4.80,1250,'ACTIVE','Ho Chi Minh City'),
(2,4,'Daily Mart','daily-mart',0,4.50,860,'ACTIVE','Ha Noi');

INSERT INTO brands (id, name, slug) VALUES (1,'SoundMax','soundmax'),(2,'Nova','nova'),(3,'UrbanWear','urbanwear'),(4,'FreshFarm','freshfarm');

INSERT INTO categories (id, parent_id, name, slug, theme_color, level, path, sort_order) VALUES
(1,NULL,'Electronics','electronics','#8B5CF6',1,'/1/',1),
(2,NULL,'Fashion','fashion','#3B6FE0',1,'/2/',2),
(3,NULL,'Beauty','beauty','#F07A2B',1,'/3/',3),
(4,NULL,'Fresh Fruits','fresh-fruits','#E05A5A',1,'/4/',4),
(11,1,'Smartphones','smartphones',NULL,2,'/1/11/',1),
(12,1,'Tablets','tablets',NULL,2,'/1/12/',2),
(13,1,'Laptops','laptops',NULL,2,'/1/13/',3),
(14,1,'Headphones','headphones',NULL,2,'/1/14/',4),
(21,2,'Shoes','shoes',NULL,2,'/2/21/',1),
(22,2,'Bags','bags',NULL,2,'/2/22/',2),
(23,2,'Hoodies','hoodies',NULL,2,'/2/23/',3),
(31,3,'Lipstick','lipstick',NULL,2,'/3/31/',1);

INSERT INTO products (id, shop_id, category_id, brand_id, name, slug, short_description,
                      min_price, max_price, original_price, discount_percent, promo_label,
                      rating_avg, rating_count, sold_count, status) VALUES
(1, 1,14,1,'Headphone','headphone','Wireless over-ear headphone',59.00,59.00,NULL,0,NULL,4.48,99,1520,'ACTIVE'),
(2, 1,14,1,'Headphone Gold','headphone-gold','Studio headphone, gold trim',99.00,99.00,NULL,0,NULL,4.50,80,640,'ACTIVE'),
(3, 1,14,1,'Headphone Classic','headphone-classic','Classic closed-back headphone',99.00,99.00,NULL,0,NULL,4.50,72,410,'ACTIVE'),
(4, 1,11,2,'Smartphone','smartphone-a','6.1 inch smartphone',899.00,899.00,NULL,0,NULL,4.00,310,980,'ACTIVE'),
(5, 1,11,2,'Smartphone','smartphone-b','6.1 inch smartphone, blue',899.00,899.00,NULL,0,NULL,4.00,250,870,'ACTIVE'),
(6, 1,11,2,'Smartphone','smartphone-c','Smartphone with secure lock',789.00,789.00,NULL,0,NULL,4.00,180,640,'ACTIVE'),
(7, 1,11,2,'Smartphone','smartphone-d','Smartphone 256GB',999.00,999.00,NULL,0,NULL,4.00,150,520,'ACTIVE'),
(8, 1,12,2,'Tablet','tablet','10 inch tablet with pen',499.00,499.00,NULL,0,NULL,4.50,120,330,'ACTIVE'),
(9, 1,13,2,'Laptop','laptop','Ultra-thin laptop',840.00,840.00,1200.00,30,NULL,4.50,95,210,'ACTIVE'),
(10,2,21,3,'Red Sneakers','red-sneakers','High-top red sneakers',299.00,299.00,598.00,50,NULL,4.50,420,1900,'ACTIVE'),
(11,2,22,3,'Leather Bag','leather-bag','Brown leather handbag',119.70,119.70,171.00,30,NULL,4.50,210,760,'ACTIVE'),
(12,2,23,3,'Hoodie shirt','hoodie-shirt','Cotton hoodie, 3 colors',2.99,2.99,NULL,0,'Buy 1 get 1',4.50,99,2400,'ACTIVE'),
(13,2,31,NULL,'Lipstick','lipstick','Matte lipstick',25.00,25.00,NULL,0,NULL,4.50,66,300,'ACTIVE'),
(14,2,4,4,'Pear','pear','Fresh pear',3.00,3.00,NULL,0,NULL,4.00,40,900,'ACTIVE'),
(15,2,4,4,'Avocado','avocado','Fresh avocado',4.00,4.00,NULL,0,NULL,4.00,52,850,'ACTIVE'),
(16,2,4,4,'Cherry','cherry','Fresh cherry',10.00,10.00,NULL,0,NULL,5.00,77,640,'ACTIVE'),
(17,2,4,4,'Orange','orange','Juicy orange',7.00,7.00,NULL,0,NULL,4.50,63,720,'ACTIVE'),
(18,2,4,4,'Peach','peach','Fresh peach',15.00,15.00,NULL,0,NULL,4.00,35,410,'ACTIVE'),
(19,2,4,4,'Pomegranate','pomegranate','Fresh pomegranate',23.00,23.00,NULL,0,NULL,4.00,28,260,'ACTIVE');

UPDATE products SET
  thumbnail_url = CONCAT('/images/products/', slug, '-1.jpg'),
  description   = CONCAT(name, '. Quis occaecat magna elit magna do nisi ipsum amet excepteur tempor nisi exercitation qui.'),
  has_buyer_protection = 1;
UPDATE products SET has_free_return_30d    = 1 WHERE category_id IN (11,12,13,14,21,22,23);
UPDATE products SET is_best_deal           = 1 WHERE id IN (4,9,10,11);
UPDATE products SET supports_ship_to_store = 1 WHERE shop_id = 1;

-- Hoodie: Color x Size (3 x 5 = 15 SKU)
INSERT INTO product_options (id, product_id, name, sort_order) VALUES (1,12,'Color',0),(2,12,'Size',1);
INSERT INTO product_option_values (id, option_id, value, color_hex, sort_order) VALUES
(1,1,'Red','#A31F1F',0),(2,1,'Orange','#E8380D',1),(3,1,'Blue','#4169E1',2),
(4,2,'XS',NULL,0),(5,2,'S',NULL,1),(6,2,'M',NULL,2),(7,2,'L',NULL,3),(8,2,'XL',NULL,4);

-- SKU mặc định cho mọi sản phẩm trừ hoodie (SKU id 1..11 = product 1..11; 12..18 = product 13..19)
INSERT INTO product_skus (product_id, sku_code, name, price, original_price, stock_quantity)
SELECT id, CONCAT('SKU-', LPAD(id,5,'0')), 'Default', min_price, original_price, 100
FROM products WHERE id <> 12 ORDER BY id;

INSERT INTO product_skus (product_id, sku_code, name, price, stock_quantity)
SELECT 12, CONCAT('HOODIE-', UPPER(c.value), '-', s.value), CONCAT(c.value, ' / ', s.value), 2.99, 50
FROM product_option_values c CROSS JOIN product_option_values s
WHERE c.option_id = 1 AND s.option_id = 2;

INSERT INTO sku_option_values (sku_id, option_value_id)
SELECT k.id, c.id FROM product_skus k
JOIN product_option_values c ON c.option_id = 1 AND k.name LIKE CONCAT(c.value, ' / %')
WHERE k.product_id = 12
UNION ALL
SELECT k.id, s.id FROM product_skus k
JOIN product_option_values s ON s.option_id = 2 AND k.name LIKE CONCAT('% / ', s.value)
WHERE k.product_id = 12;

INSERT INTO product_images (product_id, url, sort_order, is_primary)
SELECT id, CONCAT('/images/products/', slug, '-1.jpg'), 0, 1 FROM products;
INSERT INTO product_images (product_id, url, sort_order, is_primary)
SELECT id, CONCAT('/images/products/', slug, '-2.jpg'), 1, 0 FROM products WHERE id IN (1,12);
INSERT INTO product_images (product_id, url, sort_order, is_primary)
SELECT id, CONCAT('/images/products/', slug, '-3.jpg'), 2, 0 FROM products WHERE id = 12;

INSERT INTO product_shipping_options (product_id, method_code) SELECT id, 'STANDARD' FROM products;
INSERT INTO product_shipping_options (product_id, method_code)
SELECT id, 'EXPRESS' FROM products WHERE category_id IN (11,12,13,14,21,22,23,4);
INSERT INTO product_shipping_options (product_id, method_code) SELECT id, 'INSTANT' FROM products WHERE category_id = 4;

INSERT INTO inventory_movements (sku_id, delta, stock_after, reason, reference_type)
SELECT id, stock_quantity, stock_quantity, 'INITIAL', 'SEED' FROM product_skus;

INSERT INTO product_rating_stats (product_id) SELECT id FROM products;
UPDATE product_rating_stats SET count_1=1, count_2=2, count_3=6, count_4=30, count_5=60 WHERE product_id = 1;

INSERT INTO feedback_tags (code, name) VALUES
('SERVICE','Service'),('QUANTITY','Quantity'),('PAYMENT','Payment'),
('DELIVERY','Delivery'),('PROMOTION','Promotion'),('GIFT','Gift');

-- Review 1 gắn với đơn thật (order_item 2). Review 2-3 là dữ liệu demo (order id giả)
INSERT INTO reviews (id, product_id, sku_id, user_id, order_id, order_item_id, reviewer_name, rating, sentiment, content) VALUES
(1,1,1,3,1,2,'Buyer Demo',5,'GOOD','Great sound, fast delivery.'),
(2,1,1,5,9001,9001,'Jevon Raynor',5,'GOOD','Deserunt minim incididunt cillum'),
(3,1,1,6,9002,9002,'Jason D.',4,'GOOD','Magna pariatur sit et ullamco paria');
INSERT INTO review_tags (review_id, tag_id) VALUES (1,1),(1,4);

INSERT INTO favorites (user_id, product_id) VALUES (3,1),(3,10);

INSERT INTO flash_sales (id, title, starts_at, ends_at, status)
VALUES (1,'Weekend Flash Sale', NOW(3), NOW(3) + INTERVAL 7 DAY, 'RUNNING');
INSERT INTO flash_sale_items (flash_sale_id, sku_id, sale_price, quota) VALUES (1,8,399.00,50),(1,10,249.00,100);

INSERT INTO banners (title, subtitle, image_url, background_color, cta_text, link_type, link_target, position, badge_text, sort_order) VALUES
('Shoes','50% off','/images/banners/shoes-50.png','#F3F0FF','Buy now','CATEGORY','21','HOME_HERO',NULL,1),
('Bag deal','Up to 30% off','/images/banners/bag.jpg',NULL,NULL,'PRODUCT','11','HOME_GRID','30%',1),
('Laptop deal','Up to 30% off','/images/banners/laptop.jpg',NULL,NULL,'PRODUCT','9','HOME_GRID','30%',2),
('Fresh Fruits','Fresh every day','/images/banners/fruits.jpg',NULL,NULL,'CATEGORY','4','CATEGORY_TOP',NULL,1),
('Electronics','New arrivals','/images/banners/electronics.jpg',NULL,NULL,'CATEGORY','1','CATEGORY_TOP',NULL,2);

-- ======================= order_db =======================
USE order_db;

INSERT INTO shipping_methods (code, name, min_delivery_hours, max_delivery_hours, base_fee) VALUES
('INSTANT','Instant (2 hours delivery)',1,2,5.00),
('EXPRESS','Express (2 days delivery)',24,48,3.00),
('STANDARD','Standard (7-10 days delivery)',168,240,0.00);

INSERT INTO vouchers (id, code, name, description, discount_type, discount_value, max_discount_amount,
                      min_order_amount, total_quantity, per_user_limit, starts_at, ends_at) VALUES
(1,'WELCOME10','Welcome 10%','10% off, max $50','PERCENT',10.00,50.00,20.00,1000,1,NOW(3) - INTERVAL 1 DAY,NOW(3) + INTERVAL 90 DAY),
(2,'FREESHIP','Free shipping $5','$5 off for orders from $30','FIXED',5.00,NULL,30.00,5000,3,NOW(3) - INTERVAL 1 DAY,NOW(3) + INTERVAL 90 DAY),
(3,'SALE50','Big sale $50','$50 off for orders from $500','FIXED',50.00,NULL,500.00,200,1,NOW(3) - INTERVAL 1 DAY,NOW(3) + INTERVAL 30 DAY);

INSERT INTO carts (id, user_id) VALUES (1,3);
INSERT INTO cart_items (cart_id, shop_id, product_id, sku_id, quantity, added_price) VALUES
(1,2,10,10,1,299.00),(1,1,1,1,1,59.00);

-- Đơn mẫu đã giao: 899 + 2x59 = 1017 ; thuế 10% = 101.70 ; tổng 1118.70
INSERT INTO orders (id, order_no, user_id, status, payment_status, subtotal_amount, discount_amount, tax_rate, tax_amount,
                    shipping_fee, service_fee, total_amount, payment_method_type, payment_method_label, shipping_method_code,
                    recipient_name, recipient_phone, ship_province, ship_district, ship_ward, ship_address_line,
                    idempotency_key, paid_at, shipped_at, delivered_at) VALUES
(1,'EC20260915000001',3,'DELIVERED','PAID',1017.00,0.00,0.1000,101.70,0.00,0.00,1118.70,'CARD','VISA ****2334','EXPRESS',
 'Buyer Demo','0900000003','Ho Chi Minh City','District 1','Ben Nghe Ward','12 Nguyen Hue',
 'seed-order-0001','2026-09-15 10:00:05.000','2026-09-15 14:00:00.000','2026-09-17 09:00:00.000');

INSERT INTO shipments (id, order_id, shop_id, shipping_method_code, carrier, tracking_no, status, shipped_at, delivered_at) VALUES
(1,1,1,'EXPRESS','Demo Express','TRK0001','DELIVERED','2026-09-15 14:00:00.000','2026-09-17 09:00:00.000');

INSERT INTO order_items (id, order_id, shipment_id, shop_id, product_id, sku_id, product_name, sku_name, image_url, unit_price, quantity, is_reviewed) VALUES
(1,1,1,1,4,4,'Smartphone','Default','/images/products/smartphone-a-1.jpg',899.00,1,0),
(2,1,1,1,1,1,'Headphone','Default','/images/products/headphone-1.jpg',59.00,2,1);

INSERT INTO order_status_history (order_id, from_status, to_status, note, created_at) VALUES
(1,NULL,'PENDING_PAYMENT','Order created','2026-09-15 10:00:00.000'),
(1,'PENDING_PAYMENT','PAID','Payment success','2026-09-15 10:00:05.000'),
(1,'PAID','SHIPPING','Handed to carrier','2026-09-15 14:00:00.000'),
(1,'SHIPPING','DELIVERED','Delivered','2026-09-17 09:00:00.000');

-- ======================= payment_db =======================
USE payment_db;

INSERT INTO payment_methods (id, user_id, type, brand, last4, holder_name, exp_month, exp_year, paypal_email, provider_token, is_default) VALUES
(1,3,'CARD','VISA','2334','Buyer Demo',12,2028,NULL,'tok_demo_visa',1),
(2,3,'CARD','MAESTRO','3774','Buyer Demo',6,2027,NULL,'tok_demo_maestro',0),
(3,3,'PAYPAL','PAYPAL',NULL,NULL,NULL,NULL,'abc@gmail.com','tok_demo_paypal',0);

INSERT INTO payments (id, payment_no, order_id, order_no, user_id, payment_method_id, method_type, method_brand, method_last4,
                      amount, status, provider, provider_txn_id, idempotency_key, paid_at) VALUES
(1,'PAY20260915000001',1,'EC20260915000001',3,1,'CARD','VISA','2334',1118.70,'SUCCESS','MOCK','mock_txn_0001','seed-pay-0001','2026-09-15 10:00:05.000');

INSERT INTO payment_transactions (payment_id, type, amount, status, provider_txn_id) VALUES (1,'CHARGE',1118.70,'SUCCESS','mock_txn_0001');
