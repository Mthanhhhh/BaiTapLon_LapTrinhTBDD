package com.team.ecommerce.auth.controller;
import com.team.ecommerce.auth.service.AuthService;
import com.team.ecommerce.shared.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequiredArgsConstructor
@RequestMapping("/api/v1/auth/notifications")
@PreAuthorize("isAuthenticated()")
public class NotificationController {
 private final AuthService auth;
 private final JdbcTemplate jdbc;
 @GetMapping public ApiResponse<Map<String,Object>> inbox(@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="ALL") String type) {
  Long uid=auth.getCurrentUserId();
  if(!Set.of("ALL","ORDER","PROMOTION","SYSTEM").contains(type))throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST,"Loại thông báo không hợp lệ");
  String filter="ALL".equals(type)?"n.type<>'CHAT'":"n.type=?";
  var args=new ArrayList<Object>();args.add(uid);if(!"ALL".equals(type))args.add(type);args.add(Math.min(100000,Math.max(0,page))*30);
  var rows=jdbc.queryForList("SELECT n.id,n.type,n.title,n.body,n.order_id AS orderId,n.is_read AS isRead,n.created_at AS createdAt,o.order_no AS orderNo,o.status AS orderStatus,o.payment_status AS paymentStatus,(SELECT i.image_url FROM order_db.order_items i WHERE i.order_id=n.order_id ORDER BY i.id LIMIT 1) AS imageUrl FROM app_notifications n LEFT JOIN order_db.orders o ON o.id=n.order_id AND o.user_id=n.user_id WHERE n.user_id=? AND "+filter+" ORDER BY n.id DESC LIMIT 31 OFFSET ?",args.toArray());
  boolean last=rows.size()<=30;if(!last)rows.remove(30);
  return ApiResponse.success(Map.of("content",rows,"unread",jdbc.queryForObject("SELECT COUNT(*) FROM app_notifications WHERE user_id=? AND is_read=0 AND type<>'CHAT'",Long.class,uid),"last",last));
 }
 @PostMapping("/{id}/read") public ApiResponse<Boolean> read(@PathVariable Long id) {jdbc.update("UPDATE app_notifications SET is_read=1 WHERE id=? AND user_id=?",id,auth.getCurrentUserId());return ApiResponse.success(true);}
 @PostMapping("/read-all") public ApiResponse<Boolean> readAll(){jdbc.update("UPDATE app_notifications SET is_read=1 WHERE user_id=? AND type<>'CHAT'",auth.getCurrentUserId());return ApiResponse.success(true);}
}
