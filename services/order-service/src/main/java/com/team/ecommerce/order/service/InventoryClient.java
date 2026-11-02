package com.team.ecommerce.order.service;
import com.team.ecommerce.shared.integration.*;
import com.team.ecommerce.order.promotion.PromotionModels.Quote;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.*;
import java.util.*;
@Service @RequiredArgsConstructor
public class InventoryClient {
 private final IntegrationClient client;private final DomainOutbox outbox;private final ProjectionStore projections;private final JdbcTemplate db;
 public void reserve(long order,Quote quote,boolean cod){
  var lines=quote.lines().stream().map(l->Map.<String,Object>of("skuId",l.skuId(),"productId",l.productId(),"quantity",l.quantity(),"basePrice",l.basePrice())).toList();
  if(TransactionSynchronizationManager.isSynchronizationActive())TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){@Override public void afterCompletion(int status){if(status==STATUS_ROLLED_BACK)try{client.command("product","inventory-release",Map.of("orderId",order));}catch(Exception ignored){/* Product owner reconciles expired orphan holds against order state. */}}});
  var response=client.post("product","/internal/domain/inventory-reserve",Map.of("orderId",order,"lines",lines));
  for(var row:(List<Map<String,Object>>)response.get("skus"))projections.apply("product","product_skus",row.get("id").toString(),((Number)response.get("version")).longValue(),row,false);
  if(cod)movement("commit",order);
 }
 public void movement(String action,long order){var lines=db.queryForList("SELECT sku_id AS skuId,product_id AS productId,quantity FROM order_items WHERE order_id=? ORDER BY sku_id",order);outbox.enqueue("product","inventory-"+action,Map.of("orderId",order,"lines",lines),"inventory:"+action+":"+order);}
}
