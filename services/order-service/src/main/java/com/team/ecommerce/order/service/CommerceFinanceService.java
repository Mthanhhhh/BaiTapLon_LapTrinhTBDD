package com.team.ecommerce.order.service;

import com.team.ecommerce.order.promotion.PromotionModels.Quote;
import com.team.ecommerce.shared.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.*;
import java.util.*;

@Service @RequiredArgsConstructor
@Transactional("orderTransactionManager")
public class CommerceFinanceService {
 private final JdbcTemplate db;
 public static BigDecimal money(BigDecimal amount){return amount.setScale(0,RoundingMode.HALF_UP);}
 public static BigDecimal includedVat(BigDecimal gross,BigDecimal rate){return money(gross.multiply(rate).divide(BigDecimal.valueOf(100).add(rate),8,RoundingMode.HALF_UP));}
 public Map<String,Object> policy(long shop){var rows=db.queryForList("SELECT vat_percent AS vatPercent,commission_percent AS commissionPercent FROM commerce_finance_policy WHERE shop_id=?",shop);return rows.isEmpty()?Map.of("vatPercent",0,"commissionPercent",0):rows.get(0);}
 public void configure(long actor,long shop,BigDecimal vat,BigDecimal commission){
  if(vat==null||commission==null||vat.signum()<0||commission.signum()<0||vat.compareTo(BigDecimal.valueOf(100))>0||commission.compareTo(BigDecimal.valueOf(100))>0)throw new BadRequestException("Thuế và phí phải từ 0 đến 100 phần trăm.");
  db.update("INSERT INTO commerce_finance_policy(shop_id,vat_percent,commission_percent,updated_by) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE vat_percent=VALUES(vat_percent),commission_percent=VALUES(commission_percent),updated_by=VALUES(updated_by)",shop,vat,commission,actor);
 }
 public void snapshot(long order,Quote quote){
  long shop=quote.lines().get(0).shopId();var policy=policy(shop);BigDecimal vatRate=new BigDecimal(policy.get("vatPercent").toString()),feeRate=new BigDecimal(policy.get("commissionPercent").toString());
  BigDecimal shopDiscount=quote.applied().stream().filter(a->"SHOP".equals(a.layer())).map(a->a.amount()).reduce(BigDecimal.ZERO,BigDecimal::add);
  BigDecimal subsidy=quote.applied().stream().filter(a->"PLATFORM".equals(a.layer())).map(a->a.amount()).reduce(BigDecimal.ZERO,BigDecimal::add);
  BigDecimal sellerGross=quote.subtotal().subtract(shopDiscount),vat=includedVat(sellerGross,vatRate),fee=money(sellerGross.multiply(feeRate).divide(BigDecimal.valueOf(100)));
  db.update("INSERT INTO commerce_order_finance(order_id,shop_id,goods_gross,shop_discount,platform_subsidy,goods_net,vat_included,commission,seller_receivable,vat_percent,commission_percent) VALUES(?,?,?,?,?,?,?,?,?,?,?)",order,shop,quote.subtotal(),shopDiscount,subsidy,sellerGross,vat,fee,sellerGross.subtract(fee),vatRate,feeRate);
 }
 public Map<String,Object> report(Long shop,int days){
  days=Math.max(1,Math.min(366,days));String condition=shop==null?"":" AND f.shop_id=?";
  // One row per order: never join raw order_items into money aggregates.
  List<Object> args=new ArrayList<>();args.add(days);if(shop!=null)args.add(shop);
  String from=" FROM commerce_order_finance f JOIN orders o ON o.id=f.order_id WHERE o.currency='VND' AND o.created_at>=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL ? DAY)"+condition;
  var totals=db.queryForMap("SELECT COUNT(*) AS totalOrders,COALESCE(SUM(o.status='DELIVERED'),0) AS deliveredOrders,COALESCE(SUM(o.status IN ('PENDING_PAYMENT','WAITING_CONFIRMATION','WAITING_PICKUP','SHIPPING')),0) AS pendingOrders,COALESCE(SUM(o.status='CANCELLED'),0) AS cancelledOrders,COALESCE(SUM(o.status='RETURNED'),0) AS returnedOrders,COALESCE(SUM(CASE WHEN o.status='DELIVERED' THEN f.goods_gross ELSE 0 END),0) AS grossRevenue,COALESCE(SUM(CASE WHEN o.status='DELIVERED' THEN f.shop_discount ELSE 0 END),0) AS shopDiscount,COALESCE(SUM(CASE WHEN o.status='DELIVERED' THEN f.platform_subsidy ELSE 0 END),0) AS platformSubsidy,COALESCE(SUM(CASE WHEN o.status='DELIVERED' THEN f.goods_net ELSE 0 END),0) AS revenue,COALESCE(SUM(CASE WHEN o.status='DELIVERED' THEN f.vat_included ELSE 0 END),0) AS vatIncluded,COALESCE(SUM(CASE WHEN o.status='DELIVERED' THEN f.commission ELSE 0 END),0) AS commission,COALESCE(SUM(CASE WHEN o.status='DELIVERED' THEN f.seller_receivable ELSE 0 END),0) AS sellerReceivable,COALESCE(SUM(CASE WHEN o.status='DELIVERED' THEN o.shipping_fee ELSE 0 END),0) AS shippingCollected,COALESCE(SUM(CASE WHEN o.status='DELIVERED' THEN o.total_amount ELSE 0 END),0) AS buyerPaid,COALESCE(SUM(CASE WHEN o.status='RETURNED' THEN o.total_amount ELSE 0 END),0) AS returnsValue"+from,args.toArray());
  totals.put("revenueExVat",new BigDecimal(totals.get("revenue").toString()).subtract(new BigDecimal(totals.get("vatIncluded").toString())));
  totals.put("taxCharged",db.queryForObject("SELECT COALESCE(SUM(CASE WHEN o.status='DELIVERED' THEN o.tax_amount ELSE 0 END),0)"+from,BigDecimal.class,args.toArray()));
  var refundArgs=new ArrayList<Object>();refundArgs.add(days);if(shop!=null)refundArgs.add(shop);
  totals.put("refunded",db.queryForObject("SELECT COALESCE(SUM(r.amount),0) FROM commerce_refunds r JOIN commerce_order_finance f ON f.order_id=r.order_id JOIN orders o ON o.id=r.order_id WHERE o.currency='VND' AND r.created_at>=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL ? DAY)"+(shop==null?"":" AND f.shop_id=?"),BigDecimal.class,refundArgs.toArray()));
  totals.put("otherCurrencyOrders",db.queryForObject("SELECT COUNT(*) FROM orders o JOIN commerce_order_finance f ON f.order_id=o.id WHERE o.currency<>'VND' AND o.created_at>=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL ? DAY)"+condition,Long.class,args.toArray()));
  totals.put("days",days);totals.put("daily",db.queryForList("SELECT DATE(o.created_at) AS date,COUNT(*) AS orders,COALESCE(SUM(CASE WHEN o.status='DELIVERED' THEN f.goods_net ELSE 0 END),0) AS revenue"+from+" GROUP BY DATE(o.created_at) ORDER BY date",args.toArray()));
  totals.put("policy",shop==null?Map.of():policy(shop));
  totals.put("statuses",db.queryForList("SELECT o.status,COUNT(*) AS count"+from+" GROUP BY o.status",args.toArray()));
  totals.put("topProducts",db.queryForList("SELECT i.product_id AS id,MAX(i.product_name) AS name,MAX(p.thumbnail_url) AS image,SUM(i.quantity) AS units,SUM(i.line_total) AS gross FROM order_items i JOIN orders o ON o.id=i.order_id LEFT JOIN ref_product_products p ON p.id=i.product_id WHERE o.currency='VND' AND o.status='DELIVERED' AND o.created_at>=DATE_SUB(UTC_TIMESTAMP(3),INTERVAL ? DAY)"+(shop==null?"":" AND i.shop_id=?")+" GROUP BY i.product_id ORDER BY units DESC LIMIT 10",args.toArray()));
  return totals;
 }
}
