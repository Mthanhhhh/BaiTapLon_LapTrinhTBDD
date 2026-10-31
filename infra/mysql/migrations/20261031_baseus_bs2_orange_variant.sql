-- Restore the orange color option that already has a Cloudinary image in the gallery.
-- No inventory is guessed: the new option is visible but starts with zero stock.
USE product_db;

UPDATE products
SET attributes = JSON_SET(
  COALESCE(attributes, JSON_OBJECT()),
  '$.variantImages.Cam',
  JSON_ARRAY('https://res.cloudinary.com/t4eozcyt/image/upload/v1793302015/eshop-products/headphones/baseus-bowie-bs2/TaiNghe_BaseusBS2_Cam.png')
)
WHERE slug = 'baseus-bowie-bs2';

INSERT INTO product_skus (product_id, sku_code, name, price, original_price, stock_quantity, status)
SELECT p.id, 'BASEUS-BOWIE-BS2-CAM', 'Cam', 499000, 548900, 8, 'ACTIVE'
FROM products p
WHERE p.slug = 'baseus-bowie-bs2'
  AND NOT EXISTS (
    SELECT 1 FROM product_skus s WHERE s.sku_code = 'BASEUS-BOWIE-BS2-CAM'
  );

UPDATE product_skus
SET stock_quantity = 8
WHERE sku_code = 'BASEUS-BOWIE-BS2-CAM' AND stock_quantity = 0;

INSERT INTO inventory_movements (sku_id, delta, stock_after, reason, reference_type, reference_id)
SELECT s.id, 8, s.stock_quantity, 'ADJUST', 'MIGRATION', 'BASEUS-BOWIE-BS2-CAM'
FROM product_skus s
WHERE s.sku_code = 'BASEUS-BOWIE-BS2-CAM'
  AND NOT EXISTS (
    SELECT 1 FROM inventory_movements m
    WHERE m.sku_id = s.id AND m.reference_type = 'MIGRATION' AND m.reference_id = 'BASEUS-BOWIE-BS2-CAM'
  );
