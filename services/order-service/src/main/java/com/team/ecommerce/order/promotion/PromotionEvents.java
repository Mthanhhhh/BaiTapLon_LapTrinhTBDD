package com.team.ecommerce.order.promotion;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.*;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.socket.handler.ConcurrentWebSocketSessionDecorator;
import java.time.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component @RequiredArgsConstructor
public class PromotionEvents extends TextWebSocketHandler {
 private final JdbcTemplate db;
 private final StringRedisTemplate redis;
 private final ObjectMapper json=new ObjectMapper().findAndRegisterModules();
 private final Map<String,WebSocketSession> sessions=new ConcurrentHashMap<>();
 private final DefaultRedisScript<Long> limiter=new DefaultRedisScript<>("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],10) end; return n",Long.class);
 public void throttle(long user){try{Long count=redis.execute(limiter,List.of("promo:checkout:rate:"+user));if(count!=null&&count>30)throw new com.team.ecommerce.shared.exception.BadRequestException("Bạn thao tác quá nhanh. Vui lòng thử lại sau vài giây.");}catch(org.springframework.dao.DataAccessException ignored){/* SQL quota, stock and budget guards remain authoritative when Redis is unavailable. */}}
 public String enqueue(String type,Map<String,?> payload){try{String id=UUID.randomUUID().toString();db.update("INSERT INTO promo_outbox(event_id,type,payload) VALUES(?,?,?)",id,type,json.writeValueAsString(payload));
  if(TransactionSynchronizationManager.isSynchronizationActive())TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){@Override public void afterCommit(){try{if(payload.get("productIds") instanceof java.util.Collection<?> ids)for(Object product:ids)redis.delete("products::id:"+product);}catch(org.springframework.dao.DataAccessException ignored){}changed();}});else changed();return id;
 }catch(java.io.IOException e){throw new IllegalStateException(e);}}
 public void changed(){try{redis.delete("promo:catalog");redis.convertAndSend("eshop:promotions",Instant.now().toString());}catch(org.springframework.dao.DataAccessException ignored){broadcast();}}
 public List<Map<String,Object>> cachedCatalog(java.util.function.Supplier<List<Map<String,Object>>> loader){try{String cached=redis.opsForValue().get("promo:catalog");if(cached!=null)return json.readValue(cached,new com.fasterxml.jackson.core.type.TypeReference<List<Map<String,Object>>>(){});}catch(Exception ignored){}
  var value=loader.get();try{redis.opsForValue().set("promo:catalog",json.writeValueAsString(value),Duration.ofSeconds(1));}catch(Exception ignored){}return value;
 }
 public void broadcast(){try{String message=json.writeValueAsString(Map.of("type","PROMOTIONS_CHANGED","serverTime",Instant.now().toString()));for(var s:sessions.values())try{if(s.isOpen())s.sendMessage(new TextMessage(message));}catch(Exception e){sessions.remove(s.getId());try{s.close();}catch(Exception ignored){}}}catch(Exception ignored){}}
 @Override public void afterConnectionEstablished(WebSocketSession session)throws Exception{sessions.put(session.getId(),new ConcurrentWebSocketSessionDecorator(session,5000,16384));session.sendMessage(new TextMessage(json.writeValueAsString(Map.of("type","CONNECTED","serverTime",Instant.now().toString()))));}
 @Override public void afterConnectionClosed(WebSocketSession session,CloseStatus status){sessions.remove(session.getId());}
 @Override protected void handleTextMessage(WebSocketSession session,TextMessage message)throws Exception{if(message.getPayloadLength()>128){session.close(CloseStatus.TOO_BIG_TO_PROCESS);return;}if("ping".equals(message.getPayload()))sessions.get(session.getId()).sendMessage(new TextMessage("{\"type\":\"PONG\",\"serverTime\":\""+Instant.now()+"\"}"));}
}
