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
 @GetMapping public ApiResponse<Map<String,Object>> inbox(@RequestParam(defaultValue="0") int page) {
  Long uid=auth.getCurrentUserId();
  jdbc.update("INSERT INTO app_notifications(user_id,event_key,type,title,body) SELECT ?,CONCAT('voucher-',id),'PROMOTION',name,LEFT(CONCAT('Mã ',code,': ',COALESCE(description,'')),500) FROM order_db.vouchers WHERE status='ACTIVE' AND starts_at<=NOW() AND ends_at>NOW() AND used_quantity<total_quantity ON DUPLICATE KEY UPDATE event_key=VALUES(event_key)",uid);
  var rows=jdbc.queryForList("SELECT id,type,title,body,order_id AS orderId,is_read AS isRead,created_at AS createdAt FROM app_notifications WHERE user_id=? ORDER BY id DESC LIMIT 30 OFFSET ?",uid,Math.min(100000,Math.max(0,page))*30);
  return ApiResponse.success(Map.of("content",rows,"unread",jdbc.queryForObject("SELECT COUNT(*) FROM app_notifications WHERE user_id=? AND is_read=0",Long.class,uid),"last",rows.size()<30));
 }
 @PostMapping("/{id}/read") public ApiResponse<Boolean> read(@PathVariable Long id) {jdbc.update("UPDATE app_notifications SET is_read=1 WHERE id=? AND user_id=?",id,auth.getCurrentUserId());return ApiResponse.success(true);}
 @PostMapping("/read-all") public ApiResponse<Boolean> readAll(){jdbc.update("UPDATE app_notifications SET is_read=1 WHERE user_id=?",auth.getCurrentUserId());return ApiResponse.success(true);}
}
