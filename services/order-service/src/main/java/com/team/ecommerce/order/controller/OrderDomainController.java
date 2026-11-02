package com.team.ecommerce.order.controller;
import com.team.ecommerce.shared.integration.DomainCommandHandler;
import com.team.ecommerce.shared.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@RestController @RequestMapping("/internal/domain") @RequiredArgsConstructor
@Transactional("orderTransactionManager")
public class OrderDomainController implements DomainCommandHandler {
 private final JdbcTemplate db;
 @GetMapping("/reservation-state/{id}")public Map<String,Object> state(@PathVariable long id){var rows=db.queryForList("SELECT state FROM promo_reservations WHERE order_id=?",id);return Map.of("state",rows.isEmpty()?"ABSENT":rows.get(0).get("state"));}
 @GetMapping("/review-proof")public Map<String,Object> review(@RequestParam long user,@RequestParam long order,@RequestParam long product){return Map.of("items",db.queryForList("SELECT i.id,i.sku_id FROM orders o JOIN order_items i ON i.order_id=o.id WHERE o.id=? AND o.user_id=? AND o.status='DELIVERED' AND i.product_id=?",order,user,product));}
 @GetMapping("/recent-orders/{user}")public Map<String,Object> recent(@PathVariable long user){return Map.of("orders",db.queryForList("SELECT order_no,status,DATE_FORMAT(created_at,'%d/%m/%Y') AS created_date FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT 5",user));}
 @Override @PostMapping("/{action}")public Map<String,Object> handle(@PathVariable String action,@RequestBody Map<String,Object> input){if(action.equals("review-recorded")){db.update("UPDATE order_items SET is_reviewed=1 WHERE id=?",input.get("orderItemId"));return Map.of("success",true);}throw new BadRequestException("Lệnh đơn hàng không hợp lệ.");}
}
