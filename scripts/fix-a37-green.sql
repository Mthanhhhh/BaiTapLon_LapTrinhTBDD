USE product_db;
SET NAMES utf8mb4;
START TRANSACTION;
SET @green=CONVERT(0x58616E68206CC3A1 USING utf8mb4);
SET @green_path=CONCAT('$.variantImages.',JSON_QUOTE(@green));
SET @bad_green=CONVERT(0x58616E68206CC383C2A1 USING utf8mb4);
SET @bad_path=CONCAT('$.variantImages.',JSON_QUOTE(@bad_green));
UPDATE products
SET attributes=JSON_REMOVE(JSON_SET(attributes,@green_path,JSON_ARRAY('https://res.cloudinary.com/t4eozcyt/image/upload/v1793301905/eshop-products/phones/samsung-galaxy-a37/Green.png')),@bad_path)
WHERE slug='samsung-galaxy-a37' AND deleted_at IS NULL;
UPDATE product_skus SET name=CONCAT(@green,' / 128GB') WHERE sku_code='SAMSUNG-GALAXY-A37-XANH-LA-128GB';
UPDATE product_skus SET name=CONCAT(@green,' / 256GB') WHERE sku_code='SAMSUNG-GALAXY-A37-XANH-LA-256GB';
INSERT INTO product_skus (product_id,sku_code,name,price,original_price,stock_quantity,status)
SELECT id,'SAMSUNG-GALAXY-A37-XANH-LA-128GB','Xanh lá / 128GB',9490000,10439000,10,'ACTIVE'
FROM products WHERE slug='samsung-galaxy-a37' AND deleted_at IS NULL
ON DUPLICATE KEY UPDATE name=VALUES(name);
INSERT INTO product_skus (product_id,sku_code,name,price,original_price,stock_quantity,status)
SELECT id,'SAMSUNG-GALAXY-A37-XANH-LA-256GB','Xanh lá / 256GB',9590000,10549000,10,'ACTIVE'
FROM products WHERE slug='samsung-galaxy-a37' AND deleted_at IS NULL
ON DUPLICATE KEY UPDATE name=VALUES(name);
COMMIT;
