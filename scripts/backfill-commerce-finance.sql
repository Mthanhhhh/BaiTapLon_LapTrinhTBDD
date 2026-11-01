USE order_db;
-- Capture existing order amounts once. Never apply today's fee/VAT policy retrospectively.
-- Legacy orders may have separately charged tax; reports retain that as taxCharged.
INSERT IGNORE INTO commerce_order_finance
 (order_id,shop_id,goods_gross,shop_discount,platform_subsidy,goods_net,vat_included,commission,seller_receivable,vat_percent,commission_percent,source)
SELECT o.id,i.shop_id,COALESCE(o.subtotal_amount,0),COALESCE(o.discount_amount,0)-COALESCE(v.subsidy,0),COALESCE(v.subsidy,0),
 GREATEST(0,COALESCE(o.subtotal_amount,0)-COALESCE(o.discount_amount,0)+COALESCE(v.subsidy,0)),0,0,
 GREATEST(0,COALESCE(o.subtotal_amount,0)-COALESCE(o.discount_amount,0)+COALESCE(v.subsidy,0)),0,0,'LEGACY'
FROM orders o
JOIN (SELECT order_id,MIN(shop_id) AS shop_id FROM order_items GROUP BY order_id HAVING COUNT(DISTINCT shop_id)=1) i ON i.order_id=o.id
LEFT JOIN (SELECT d.order_id,SUM(d.discount_amount) AS subsidy FROM promo_redemptions d JOIN promo_campaigns c ON c.id=d.campaign_id WHERE c.layer='PLATFORM' GROUP BY d.order_id) v ON v.order_id=o.id;
