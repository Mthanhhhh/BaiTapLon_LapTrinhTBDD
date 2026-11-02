package com.team.ecommerce.order.controller;
import com.team.ecommerce.shared.dto.ApiResponse;
import com.team.ecommerce.shared.exception.BadRequestException;
import com.team.ecommerce.order.service.ChatSocket;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController @RequestMapping("/api/v1/orders/chat") @RequiredArgsConstructor
@Transactional("orderTransactionManager")
public class ChatController {
 private final JdbcTemplate db;private final ChatSocket socket;private final com.team.ecommerce.shared.integration.DomainOutbox outbox;
 private Map<String,Object> own(long user,long id){var rows=db.queryForList("SELECT * FROM chat_conversations WHERE id=? AND (buyer_id=? OR owner_id=?)",id,user,user);if(rows.isEmpty())throw new AccessDeniedException("Bạn không thuộc cuộc trò chuyện.");return rows.get(0);}
 @PostMapping("/ticket") public ApiResponse<?> ticket(@AuthenticationPrincipal Long user){String ticket=UUID.randomUUID().toString();db.update("DELETE FROM chat_tickets WHERE expires_at<UTC_TIMESTAMP(3)");db.update("INSERT INTO chat_tickets(ticket,user_id,expires_at) VALUES(?,?,DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 60 SECOND))",ticket,user);return ApiResponse.success(Map.of("ticket",ticket));}
 @GetMapping public ApiResponse<?> conversations(@AuthenticationPrincipal Long user){return ApiResponse.success(db.queryForList("SELECT c.id,c.buyer_id AS buyerId,c.owner_id AS ownerId,(c.buyer_id=?) AS isBuyer,CASE WHEN c.buyer_id=? THEN s.logo_url ELSE u.avatar_url END AS counterpartyImage,c.shop_id AS shopId,s.name AS shopName,u.full_name AS buyerName,CASE WHEN c.buyer_id=? THEN s.name ELSE u.full_name END AS title,c.updated_at AS updatedAt,(SELECT content FROM chat_messages m WHERE m.conversation_id=c.id ORDER BY m.id DESC LIMIT 1) AS lastMessage,(SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id=c.id AND m.sender_id<>? AND m.id>IF(c.buyer_id=?,c.buyer_read_id,c.owner_read_id)) AS unread FROM chat_conversations c JOIN ref_product_shops s ON s.id=c.shop_id JOIN ref_auth_users u ON u.id=c.buyer_id WHERE c.buyer_id=? OR c.owner_id=? ORDER BY c.updated_at DESC",user,user,user,user,user,user,user));}
 @PostMapping public ApiResponse<?> start(@AuthenticationPrincipal Long user,@RequestBody Map<String,Long> input){Long shop=input.get("shopId"),order=input.get("orderId");long buyer=user;
  if(order!=null){var orders=db.queryForList("SELECT DISTINCT i.shop_id,o.user_id FROM orders o JOIN order_items i ON i.order_id=o.id JOIN ref_product_shops sh ON sh.id=i.shop_id WHERE o.id=? AND (o.user_id=? OR sh.owner_user_id=?)",order,user,user);if(orders.size()!=1)throw new BadRequestException("Không tìm được shop của đơn mua này.");shop=((Number)orders.get(0).get("shop_id")).longValue();buyer=((Number)orders.get(0).get("user_id")).longValue();}
  if(shop==null)throw new BadRequestException("Cần chọn shop.");var shops=db.queryForList("SELECT owner_user_id FROM ref_product_shops WHERE id=? AND deleted_at IS NULL",shop);if(shops.isEmpty())throw new BadRequestException("Shop không tồn tại.");long owner=((Number)shops.get(0).get("owner_user_id")).longValue();if(owner==buyer)throw new BadRequestException("Chọn hội thoại của khách trong hộp thư shop.");
  db.update("INSERT IGNORE INTO chat_conversations(shop_id,buyer_id,owner_id) VALUES(?,?,?)",shop,buyer,owner);return ApiResponse.success(db.queryForMap("SELECT id FROM chat_conversations WHERE shop_id=? AND buyer_id=?",shop,buyer));}
 @GetMapping("/{id}/messages") public ApiResponse<?> messages(@AuthenticationPrincipal Long user,@PathVariable long id,@RequestParam(defaultValue="0") long after,@RequestParam(required=false)Long before){own(user,id);var params=new ArrayList<Object>();params.add(id);params.add(Math.max(0,after));if(before!=null)params.add(before);var rows=db.queryForList("SELECT id,sender_id AS senderId,content,created_at AS createdAt FROM chat_messages WHERE conversation_id=? AND id>? "+(before==null?"":"AND id<? ")+"ORDER BY id "+(after>0?"ASC":"DESC")+" LIMIT 200",params.toArray());if(after<=0)Collections.reverse(rows);return ApiResponse.success(rows);}
 @PostMapping("/{id}/read") public ApiResponse<?> read(@AuthenticationPrincipal Long user,@PathVariable long id){var c=own(user,id);String field=((Number)c.get("buyer_id")).longValue()==user?"buyer_read_id":"owner_read_id";db.update("UPDATE chat_conversations SET "+field+"=(SELECT COALESCE(MAX(id),0) FROM chat_messages WHERE conversation_id=?) WHERE id=?",id,id);return ApiResponse.success("Đã đọc");}
 @PostMapping("/{id}/messages") public ApiResponse<?> send(@AuthenticationPrincipal Long user,@PathVariable long id,@RequestBody Map<String,String> input){var c=own(user,id);String content=Objects.toString(input.get("content"),"").trim(),key=Objects.toString(input.get("clientMessageId"),"");if(content.isEmpty()||content.length()>2000||!key.matches("[A-Za-z0-9_-]{16,64}"))throw new BadRequestException("Tin nhắn cần 1–2.000 ký tự và mã gửi hợp lệ.");
  if(db.queryForObject("SELECT COUNT(*) FROM chat_messages WHERE sender_id=? AND created_at>DATE_SUB(UTC_TIMESTAMP(3),INTERVAL 10 SECOND)",Integer.class,user)>20)throw new BadRequestException("Bạn gửi quá nhanh; thử lại sau vài giây.");
  int changed=db.update("INSERT IGNORE INTO chat_messages(conversation_id,sender_id,content,client_key) VALUES(?,?,?,?)",id,user,content,key);var message=db.queryForMap("SELECT id,sender_id AS senderId,content,created_at AS createdAt FROM chat_messages WHERE conversation_id=? AND sender_id=? AND client_key=?",id,user,key);
  if(changed>0){long recipient=((Number)c.get("buyer_id")).longValue()==user?((Number)c.get("owner_id")).longValue():((Number)c.get("buyer_id")).longValue();db.update("UPDATE chat_conversations SET updated_at=UTC_TIMESTAMP(3) WHERE id=?",id);outbox.enqueue("auth","notification",Map.of("userId",recipient,"eventKey","chat-"+id+"-"+message.get("id"),"type","CHAT","title","Bạn có tin nhắn mới","body",content.substring(0,Math.min(300,content.length()))),"chat:"+id+":"+message.get("id"));TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){@Override public void afterCommit(){socket.notifyUsers(user,recipient,id);}});}
  return ApiResponse.success(message);
 }
}
