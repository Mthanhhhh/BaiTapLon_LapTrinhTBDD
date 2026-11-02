package com.team.ecommerce.product.service;

import com.team.ecommerce.shared.integration.IntegrationClient;
import com.team.ecommerce.shared.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.cache.CacheManager;
import java.util.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Service @RequiredArgsConstructor
public class InventoryOwnerService {
 private final JdbcTemplate db;private final StringRedisTemplate redis;private final IntegrationClient clients;private final PlatformTransactionManager manager;private final CacheManager caches;
 private static final DefaultRedisScript<Long> RESERVE=new DefaultRedisScript<>("for i=1,#KEYS do if tonumber(ARGV[(i-1)*2+1]) < tonumber(ARGV[(i-1)*2+2]) then return 0 end end; for i=1,#KEYS do redis.call('SET',KEYS[i],ARGV[(i-1)*2+1]);redis.call('DECRBY',KEYS[i],ARGV[(i-1)*2+2]);redis.call('EXPIRE',KEYS[i],600) end; return 1",Long.class);
 static long number(Object value){return ((Number)value).longValue();}
 @Transactional("productTransactionManager")
 public Map<String,Object> reserve(Map<String,Object> input){
  long order=number(input.get("orderId"));var lines=(List<Map<String,Object>>)input.get("lines");
  if(order<=0||lines==null||lines.isEmpty()||lines.size()>100)throw new BadRequestException("Danh sách giữ hàng không hợp lệ.");
  var sorted=lines.stream().sorted(Comparator.comparingLong(l->number(l.get("skuId")))).toList();
  String fingerprint;try{fingerprint=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(new com.fasterxml.jackson.databind.ObjectMapper().enable(com.fasterxml.jackson.databind.SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS).writeValueAsBytes(sorted)));}catch(Exception e){throw new IllegalArgumentException(e);}
  db.update("INSERT IGNORE INTO inventory_reservations(order_id,fingerprint,status,reconcile_at) VALUES(?,?,'NEW',DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 5 MINUTE))",order,fingerprint);
  var reservation=db.queryForMap("SELECT * FROM inventory_reservations WHERE order_id=? FOR UPDATE",order);
  if(!fingerprint.equals(reservation.get("fingerprint")))throw new BadRequestException("Mã giữ hàng đã dùng cho sản phẩm khác.");
  String state=reservation.get("status").toString();if(!"NEW".equals(state)){if(Set.of("RELEASED","RETURNED").contains(state))throw new BadRequestException("Lượt giữ hàng đã được hoàn.");return snapshot(sorted);}
  var keys=new ArrayList<String>();var arguments=new ArrayList<String>();var seen=new HashSet<Long>();
  for(var line:sorted){long sku=number(line.get("skuId")),product=number(line.get("productId")),quantity=number(line.get("quantity"));
   if(quantity<1||quantity>99||!seen.add(sku))throw new BadRequestException("Số lượng/phân loại không hợp lệ.");
   var rows=db.queryForList("SELECT s.stock_quantity,s.price FROM product_skus s JOIN products p ON p.id=s.product_id JOIN shops sh ON sh.id=p.shop_id WHERE s.id=? AND s.product_id=? AND s.deleted_at IS NULL AND p.deleted_at IS NULL AND p.status='ACTIVE' AND sh.status='ACTIVE' AND sh.deleted_at IS NULL FOR UPDATE",sku,product);
   if(rows.isEmpty()||number(rows.get(0).get("stock_quantity"))<quantity||new BigDecimal(rows.get(0).get("price").toString()).compareTo(new BigDecimal(line.get("basePrice").toString()))!=0)throw new BadRequestException("Giá hoặc tồn kho vừa thay đổi. Vui lòng tính lại đơn.");
   keys.add("inventory:sku:"+sku);arguments.add(rows.get(0).get("stock_quantity").toString());arguments.add(Long.toString(quantity));
  }
  try{Long accepted=redis.execute(RESERVE,keys,arguments.toArray());if(!Long.valueOf(1).equals(accepted))throw new BadRequestException("Không đủ tồn kho.");}catch(org.springframework.dao.DataAccessException unavailable){/* SQL conditional updates remain authoritative during Redis outages. */}
  for(var line:sorted){long qty=number(line.get("quantity"));if(db.update("UPDATE product_skus SET stock_quantity=stock_quantity-?,version=COALESCE(version,0)+1 WHERE id=? AND product_id=? AND stock_quantity>=?",qty,line.get("skuId"),line.get("productId"),qty)!=1)throw new BadRequestException("Hàng vừa hết.");db.update("INSERT INTO inventory_reservation_lines(order_id,sku_id,product_id,quantity,base_price) VALUES(?,?,?,?,?)",order,line.get("skuId"),line.get("productId"),qty,line.get("basePrice"));evict(number(line.get("productId")));}
  db.update("UPDATE inventory_reservations SET status='HELD' WHERE order_id=?",order);return snapshot(sorted);
 }
 private Map<String,Object> snapshot(List<Map<String,Object>> lines){var rows=new ArrayList<Map<String,Object>>();for(var line:lines)rows.add(db.queryForMap("SELECT * FROM product_skus WHERE id=?",line.get("skuId")));return Map.of("version",db.queryForObject("SELECT COALESCE(MAX(id),0) FROM service_outbox",Long.class),"skus",rows);}
 @Transactional("productTransactionManager")
 public Map<String,Object> movement(String action,Map<String,Object> input){
  long order=number(input.get("orderId"));var records=db.queryForList("SELECT * FROM inventory_reservations WHERE order_id=? FOR UPDATE",order);
  List<Map<String,Object>> lines;
  if(records.isEmpty()){
   // Migrated orders already affected source stock; legacy adjustments have a separate durable deduplication key.
   if(db.update("INSERT IGNORE INTO inventory_movements(movement_key) VALUES(?)",action+":"+order)==0)return Map.of("success",true);
   lines=(List<Map<String,Object>>)input.getOrDefault("lines",List.of());
  }else{
   var row=records.get(0);String state=row.get("status").toString();boolean delivered=Boolean.TRUE.equals(row.get("delivered"))||row.get("delivered") instanceof Number n&&n.intValue()!=0;
   if(action.equals("commit")){if(state.equals("HELD"))db.update("UPDATE inventory_reservations SET status='COMMITTED' WHERE order_id=?",order);return Map.of("success",true);}
   if(state.equals("RELEASED")||state.equals("RETURNED"))return Map.of("success",true);
   if(action.equals("delivered")&&delivered)return Map.of("success",true);
   if(action.equals("return")&&!delivered)throw new BadRequestException("Chưa ghi nhận giao hàng.");
   if(action.equals("release")&&delivered)throw new BadRequestException("Đơn đã giao không thể hủy giữ hàng.");
   lines=db.queryForList("SELECT sku_id AS skuId,product_id AS productId,quantity FROM inventory_reservation_lines WHERE order_id=? ORDER BY sku_id",order);
   if(action.equals("delivered"))db.update("UPDATE inventory_reservations SET delivered=1,status='COMMITTED' WHERE order_id=?",order);
   else db.update("UPDATE inventory_reservations SET status=? WHERE order_id=?",action.equals("return")?"RETURNED":"RELEASED",order);
  }
  for(var line:lines){long qty=number(line.get("quantity")),sku=number(line.get("skuId")),product=number(line.get("productId"));
   if(action.equals("release")||action.equals("return"))db.update("UPDATE product_skus SET stock_quantity=stock_quantity+?,version=COALESCE(version,0)+1 WHERE id=? AND product_id=?",qty,sku,product);
   if(action.equals("delivered")||action.equals("return")){long delta=action.equals("return")?-qty:qty;db.update("UPDATE product_skus SET sold_count=GREATEST(0,sold_count+?),version=COALESCE(version,0)+1 WHERE id=? AND product_id=?",delta,sku,product);db.update("UPDATE products SET sold_count=GREATEST(0,sold_count+?) WHERE id=?",delta,product);}
   try{redis.delete("inventory:sku:"+sku);}catch(org.springframework.dao.DataAccessException ignored){}evict(product);
  }return Map.of("success",true);
 }
 private void evict(long product){var cache=caches.getCache("products");if(cache!=null)try{cache.evict("id:"+product);}catch(org.springframework.dao.DataAccessException ignored){}}
 @Scheduled(fixedDelay=10000,initialDelay=10000)public void reconcile(){
  for(var row:db.queryForList("SELECT order_id FROM inventory_reservations WHERE status='HELD' AND reconcile_at<=UTC_TIMESTAMP(3) LIMIT 50"))try{
   long order=number(row.get("order_id"));var state=clients.get("order","/internal/domain/reservation-state/"+order);String status=state.get("state").toString();
   if(status.equals("ABSENT")||status.equals("RELEASED"))new TransactionTemplate(manager).executeWithoutResult(tx->movement("release",Map.of("orderId",order)));
   else if(status.equals("COMMITTED"))new TransactionTemplate(manager).executeWithoutResult(tx->movement("commit",Map.of("orderId",order)));
  }catch(Exception ignored){/* Never release a live order merely because its owner is unavailable. */}
 }
}
