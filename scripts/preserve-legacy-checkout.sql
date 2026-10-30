-- Compatibility migration for the existing local database with legacy shim columns.
-- Back up auth_db and order_db before running. Fresh databases do not need this file.
SET NAMES utf8mb4;
START TRANSACTION;
UPDATE order_db.orders SET
 subtotal_amount=COALESCE(subtotal_amount,subtotal),
 discount_amount=COALESCE(discount,discount_amount,0),tax_amount=COALESCE(tax,tax_amount,0),
 service_fee=COALESCE(fees,service_fee,0),total_amount=COALESCE(total_amount,total),
 recipient_name=COALESCE(recipient_name,shipping_name),recipient_phone=COALESCE(recipient_phone,shipping_phone),
 ship_address_line=COALESCE(ship_address_line,shipping_street),ship_province=COALESCE(ship_province,shipping_city),
 ship_district=COALESCE(ship_district,''),order_no=COALESCE(order_no,CONCAT('ECLEGACY-',id)),
 idempotency_key=COALESCE(idempotency_key,CONCAT('legacy-',id))
WHERE subtotal_amount IS NULL;
UPDATE order_db.order_items oi LEFT JOIN product_db.products p ON p.id=oi.product_id SET
 oi.unit_price=COALESCE(oi.unit_price,oi.price),oi.sku_id=COALESCE(oi.sku_id,oi.variant_id),
 oi.shop_id=COALESCE(oi.shop_id,p.shop_id),oi.sku_name=COALESCE(oi.sku_name,oi.variant_name),
 oi.image_url=COALESCE(oi.image_url,oi.product_image)
WHERE oi.unit_price IS NULL OR oi.sku_id IS NULL;
INSERT INTO auth_db.user_addresses(user_id,recipient_name,phone,country_code,province,district,address_line,postal_code,is_default)
SELECT a.user_id,COALESCE(a.full_name,a.fullName),a.phone,
CASE WHEN UPPER(a.country) IN ('VN','VIỆT NAM','VIET NAM','VIETNAM') THEN 'VN' WHEN UPPER(a.country) IN ('US','UNITED STATES','USA') THEN 'US' ELSE UPPER(a.country) END,
a.city,COALESCE(a.state,''),a.street,a.zip_code,COALESCE(a.is_default,0)
FROM auth_db.addresses a WHERE a.deleted_at IS NULL
AND (CHAR_LENGTH(a.country)=2 OR UPPER(a.country) IN ('VIỆT NAM','VIET NAM','VIETNAM','UNITED STATES','USA'))
AND NOT EXISTS(SELECT 1 FROM auth_db.user_addresses u WHERE u.user_id=a.user_id AND u.phone=a.phone AND u.address_line=a.street AND u.deleted_at IS NULL);
COMMIT;
