package com.team.ecommerce.auth.controller;
import com.team.ecommerce.shared.integration.*;
import com.team.ecommerce.shared.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import java.util.*;
@RestController @RequestMapping("/internal/domain") @RequiredArgsConstructor
@Transactional("authTransactionManager")
public class AuthDomainController implements DomainCommandHandler {
 private final JdbcTemplate db;
 private final IntegrationClient clients;
 private final org.springframework.data.redis.core.StringRedisTemplate redis;
 @GetMapping("/accounts/{id}") public Map<String,Object> account(@PathVariable long id){
  var rows=db.queryForList("SELECT id,full_name AS fullName,email,phone,avatar_url AS avatarUrl,status,deleted_at AS deletedAt FROM users WHERE id=?",id);
  if(rows.isEmpty())throw new BadRequestException("Account not found");
  var row=rows.get(0);row.put("roles",db.queryForList("SELECT r.code FROM user_roles ur JOIN roles r ON r.id=ur.role_id WHERE ur.user_id=?",String.class,id));return row;
 }
 @GetMapping("/accounts/{id}/provinces") public Map<String,Object> provinces(@PathVariable long id){return Map.of("provinces",db.queryForList("SELECT province FROM user_addresses WHERE user_id=? AND deleted_at IS NULL ORDER BY is_default DESC,id DESC LIMIT 3",String.class,id));}
 @Override @PostMapping("/{action}") public Map<String,Object> handle(@PathVariable String action,@RequestBody Map<String,Object> input){
  switch(action){
   case "notification" -> db.update("INSERT INTO app_notifications(user_id,event_key,type,title,body,order_id) VALUES(?,?,?,?,?,?) ON DUPLICATE KEY UPDATE event_key=VALUES(event_key)",input.get("userId"),input.get("eventKey"),input.getOrDefault("type","ORDER"),input.get("title"),input.get("body"),input.get("orderId"));
   case "grant-seller" -> {
    long user=((Number)input.get("userId")).longValue();
    if(clients.get("product","/internal/domain/shops/mine/"+user).get("shop")==null)throw new BadRequestException("Shop not found");
    db.update("INSERT IGNORE INTO user_roles(user_id,role_id) SELECT ?,id FROM roles WHERE code='SELLER'",user);
   }
   case "broadcast" -> {requireAdmin(input);db.update("INSERT INTO app_notifications(user_id,event_key,type,title,body) SELECT id,?,'PROMOTION',?,? FROM users WHERE status='ACTIVE' AND deleted_at IS NULL",input.get("eventKey"),input.get("title"),input.get("body"));}
   case "moderate-user" -> {
    requireAdmin(input);long id=((Number)input.get("id")).longValue(),actor=((Number)input.get("actor")).longValue();String status=Objects.toString(input.get("status"));
    if(id==actor||((List<?>)account(id).get("roles")).contains("ADMIN"))throw new BadRequestException("Cannot lock an administrator");
    if(!Set.of("ACTIVE","LOCKED").contains(status))throw new BadRequestException("Invalid account status");
    db.update("UPDATE users SET status=? WHERE id=? AND deleted_at IS NULL",status,id);
    if(status.equals("LOCKED"))db.update("DELETE FROM refresh_tokens WHERE user_id=?",id);
    db.update("INSERT INTO domain_audit(actor_id,action,entity_id,reason) VALUES(?,'MODERATE_USER',?,?)",actor,id,Objects.toString(input.get("reason"),""));
   }
   default -> throw new BadRequestException("Unsupported account command");
  }
  if(org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive())org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(new org.springframework.transaction.support.TransactionSynchronization(){@Override public void afterCommit(){try{redis.convertAndSend("eshop:promotions",java.time.Instant.now().toString());}catch(org.springframework.dao.DataAccessException ignored){}}});
  return Map.of("success",true);
 }
 private void requireAdmin(Map<String,Object> input){var actor=account(((Number)input.get("actor")).longValue());if(!"ACTIVE".equals(actor.get("status"))||!((List<?>)actor.get("roles")).contains("ADMIN"))throw new AccessDeniedException("Administrator required");}
}
