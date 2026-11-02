package com.team.ecommerce.order.promotion;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.*;
import java.util.concurrent.TimeUnit;
@Component @RequiredArgsConstructor @Slf4j
public class PromotionJobs {
 private final JdbcTemplate db;private final PromotionService promotions;private final PromotionEvents events;private final KafkaTemplate<String,Object> kafka;private final org.springframework.transaction.PlatformTransactionManager transactionManager;
 private final com.team.ecommerce.shared.integration.DomainOutbox outbox;
 private final ObjectMapper json=new ObjectMapper();
 @Scheduled(fixedDelay=2000) public void expire(){
  for(var row:db.queryForList("SELECT r.order_id FROM promo_reservations r JOIN orders o ON o.id=r.order_id WHERE r.state='RESERVED' AND r.expires_at<=UTC_TIMESTAMP(3) AND o.status='PENDING_PAYMENT' ORDER BY r.order_id LIMIT 50"))new TransactionTemplate(transactionManager).executeWithoutResult(tx->{long id=PromotionService.number(row.get("order_id"));var o=db.queryForMap("SELECT status,user_id FROM orders WHERE id=? FOR UPDATE",id);if(!"PENDING_PAYMENT".equals(o.get("status")))return;var r=db.queryForList("SELECT order_id FROM promo_reservations WHERE order_id=? AND state='RESERVED' AND expires_at<=UTC_TIMESTAMP(3) FOR UPDATE",id);if(r.isEmpty())return;promotions.release(id);db.update("UPDATE orders SET status='CANCELLED',updated_at=UTC_TIMESTAMP(3) WHERE id=?",id);notify(PromotionService.number(o.get("user_id")),"expired-"+id,"Đơn #"+id+" đã hết hạn","Đã hoàn hàng và ưu đãi do quá 5 phút chưa thanh toán.",id);});
 }
 @Scheduled(fixedDelay=3000) public void reminders(){new TransactionTemplate(transactionManager).executeWithoutResult(tx->{for(var r:db.queryForList("SELECT r.user_id,r.campaign_id,c.name FROM promo_reminders r JOIN promo_campaigns c ON c.id=r.campaign_id WHERE r.sent_at IS NULL AND c.status='ACTIVE' AND c.ends_at>UTC_TIMESTAMP(3) AND c.starts_at<=DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 5 MINUTE) ORDER BY r.campaign_id,r.user_id LIMIT 100 FOR UPDATE SKIP LOCKED")){db.update("UPDATE promo_reminders SET sent_at=UTC_TIMESTAMP(3) WHERE user_id=? AND campaign_id=?",r.get("user_id"),r.get("campaign_id"));events.enqueue("SALE_REMINDER",Map.of("userId",r.get("user_id"),"campaignId",r.get("campaign_id"),"name",r.get("name")));}});}
 @Scheduled(fixedDelay=1000) public void publish(){
  for(var row:db.queryForList("SELECT event_id,type,payload FROM promo_outbox WHERE published_at IS NULL AND (claimed_until IS NULL OR claimed_until<UTC_TIMESTAMP(3)) ORDER BY created_at,event_id LIMIT 20")){
   String id=row.get("event_id").toString();if(db.update("UPDATE promo_outbox SET claimed_until=DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 30 SECOND),attempts=attempts+1 WHERE event_id=? AND published_at IS NULL AND (claimed_until IS NULL OR claimed_until<UTC_TIMESTAMP(3))",id)!=1)continue;
   try{Map<String,Object> payload=json.readValue(row.get("payload").toString(),new TypeReference<>(){});Map<String,Object> event=Map.of("eventId",id,"type",row.get("type"),"payload",payload);String topic="ORDER_CREATED".equals(row.get("type"))?"order-events":"promotion-events";kafka.send(topic,Objects.toString(payload.getOrDefault("campaignId",payload.getOrDefault("orderId",id))),event).get(3,TimeUnit.SECONDS);db.update("UPDATE promo_outbox SET published_at=UTC_TIMESTAMP(3),claimed_until=NULL WHERE event_id=?",id);}
   catch(Exception e){log.warn("Outbox event {} retained for retry",id);}
  }
 }
 @KafkaListener(topics="promotion-events",groupId="promotion-notifications") @Transactional("orderTransactionManager")
 public void consume(Map<String,Object> event){String id=Objects.toString(event.get("eventId"),"");if(id.isEmpty()||db.update("INSERT IGNORE INTO promo_consumed_events(event_id,consumer_name) VALUES(?,'notifications')",id)==0)return;if("SALE_REMINDER".equals(event.get("type"))){var p=(Map<?,?>)event.get("payload");notify(PromotionService.number(p.get("userId")),"promo-reminder-"+p.get("campaignId"),"Sắp mở ưu đãi",Objects.toString(p.get("name")),null);events.enqueue("REMINDER_DELIVERED",Map.of("campaignId",p.get("campaignId")));}}
 @KafkaListener(topics="payment-events",groupId="promotion-payment-compensation") @Transactional("orderTransactionManager")
 public void paymentFailed(Map<String,Object> event){Object order=event.get("orderId");if(!(order instanceof Number)||!(event.get("reason") instanceof String))return;long id=PromotionService.number(order);if(db.queryForObject("SELECT COUNT(*) FROM promo_reservations WHERE order_id=?",Integer.class,id)==0)return;var orders=db.queryForList("SELECT status,user_id FROM orders WHERE id=? FOR UPDATE",id);if(orders.isEmpty()||!"PENDING_PAYMENT".equals(orders.get(0).get("status")))return;if(promotions.release(id)){db.update("UPDATE orders SET status='CANCELLED',updated_at=UTC_TIMESTAMP(3) WHERE id=?",id);notify(PromotionService.number(orders.get(0).get("user_id")),"payment-failed-"+id,"Thanh toán không thành công","Đơn #"+id+" đã hủy; hàng và ưu đãi được hoàn lại.",id);}}
 private void notify(long user,String key,String title,String body,Long order){var input=new LinkedHashMap<String,Object>();input.put("userId",user);input.put("eventKey",key);input.put("title",title);input.put("body",body);input.put("orderId",order);outbox.enqueue("auth","notification",input,key+":"+user);}
 @Scheduled(fixedDelay=10000) public void clock(){if(db.queryForObject("SELECT COUNT(*) FROM promo_campaigns WHERE status='ACTIVE' AND (starts_at BETWEEN DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 10 SECOND) AND UTC_TIMESTAMP(3) OR ends_at BETWEEN DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 10 SECOND) AND UTC_TIMESTAMP(3))",Integer.class)>0)events.changed();else events.heartbeat();}
}
