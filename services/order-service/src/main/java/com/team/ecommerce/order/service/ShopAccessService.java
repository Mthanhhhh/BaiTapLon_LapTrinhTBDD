package com.team.ecommerce.order.service;
import com.team.ecommerce.shared.integration.*;
import com.team.ecommerce.order.entity.Order;
import com.team.ecommerce.shared.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;
import java.util.*;
@Service @RequiredArgsConstructor
public class ShopAccessService {
 private final IntegrationClient clients;private final DomainOutbox outbox;
 public void notifyBuyer(Order order){String label=switch(order.getStatus()){case PENDING_PAYMENT->"Đang chờ thanh toán";case WAITING_CONFIRMATION->"Đang chờ shop xác nhận";case WAITING_PICKUP->"Shop đang chuẩn bị hàng";case SHIPPING->"Đơn đang giao";case DELIVERED->"Đã nhận hàng";case RETURNED->"Đã gửi yêu cầu trả hàng";case CANCELLED->"Đơn đã hủy";default->order.getStatus().name();};String key="order-"+order.getId()+"-"+order.getStatus();outbox.enqueue("auth","notification",Map.of("userId",order.getUserId(),"eventKey",key,"title","Cập nhật đơn #"+order.getId(),"body",label,"orderId",order.getId()),key);}
 public Map<String,Object> mine(Long user){return (Map<String,Object>)clients.get("product","/internal/domain/shops/mine/"+user).get("shop");}
 public Map<String,Object> register(Long user,Map<String,String> profile){return clients.post("product","/internal/domain/register-shop",Map.of("actor",user,"profile",profile));}
 public boolean ownsProduct(Long user,Long product){return Boolean.TRUE.equals(clients.get("product","/internal/domain/products/"+product+"/owner/"+user).get("owns"));}
 public void requireOwner(Long user,List<com.team.ecommerce.order.entity.OrderItem> items){if(items.isEmpty()||items.stream().anyMatch(i->!ownsProduct(user,i.getProductId())))throw new AccessDeniedException("Đơn không thuộc shop.");}
 public void requireSingleShop(List<com.team.ecommerce.order.entity.CartItem> items){if(items.stream().map(com.team.ecommerce.order.entity.CartItem::getShopId).distinct().count()!=1)throw new BadRequestException("Vui lòng đặt riêng sản phẩm từng shop.");}
}
