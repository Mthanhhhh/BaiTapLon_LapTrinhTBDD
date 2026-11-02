package com.team.ecommerce.order.service;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
@Component @RequiredArgsConstructor
public class ChatSocket extends TextWebSocketHandler {
 private final JdbcTemplate db;private final org.springframework.data.redis.core.StringRedisTemplate redis;private final Map<String,WebSocketSession> sessions=new ConcurrentHashMap<>();
 @Override public void afterConnectionEstablished(WebSocketSession session)throws Exception{
  String query=session.getUri().getRawQuery(),ticket=query==null?"":Arrays.stream(query.split("&")).filter(s->s.startsWith("ticket=")).map(s->s.substring(7)).findFirst().orElse("");
  if(!ticket.matches("[a-f0-9-]{36}")||db.update("UPDATE chat_tickets SET used=1 WHERE ticket=? AND used=0 AND expires_at>UTC_TIMESTAMP(3)",ticket)!=1){session.close(CloseStatus.POLICY_VIOLATION);return;}
  Long user=db.queryForObject("SELECT user_id FROM chat_tickets WHERE ticket=?",Long.class,ticket);session.getAttributes().put("user",user);sessions.put(session.getId(),session);session.sendMessage(new TextMessage("{\"type\":\"CONNECTED\"}"));
 }
 @Override public void afterConnectionClosed(WebSocketSession session,CloseStatus status){sessions.remove(session.getId());}
 public void notifyUsers(long sender,long recipient,long conversation){redis.convertAndSend("eshop:chat",sender+":"+recipient+":"+conversation);}
 public void broadcast(String payload){String[] ids=payload.split(":");if(ids.length!=3)return;long sender=Long.parseLong(ids[0]),recipient=Long.parseLong(ids[1]),conversation=Long.parseLong(ids[2]);for(var session:sessions.values())try{Object value=session.getAttributes().get("user");if(value instanceof Long user&&(user==sender||user==recipient)){if(db.queryForObject("SELECT COUNT(*) FROM ref_auth_users WHERE id=? AND status='ACTIVE' AND deleted_at IS NULL",Long.class,user)==0){session.close(CloseStatus.POLICY_VIOLATION);continue;}synchronized(session){session.sendMessage(new TextMessage("{\"type\":\"CHAT_MESSAGE\",\"conversationId\":"+conversation+"}"));}}}catch(Exception ignored){sessions.remove(session.getId());}}
}
