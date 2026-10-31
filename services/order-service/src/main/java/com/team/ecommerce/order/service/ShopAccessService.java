package com.team.ecommerce.order.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ShopAccessService {
    private final JdbcTemplate jdbc;
    public void notifyBuyer(com.team.ecommerce.order.entity.Order order) {
        String status=switch(order.getStatus()) {
            case PENDING_PAYMENT -> "Đang chờ thanh toán";
            case WAITING_CONFIRMATION -> "Đang chờ shop xác nhận";
            case WAITING_PICKUP -> "Shop đã xác nhận, đang chuẩn bị hàng";
            case SHIPPING -> "Đơn hàng đang được giao";
            case DELIVERED -> "Đã xác nhận nhận hàng";
            case CANCELLED -> "Đơn hàng đã hủy";
            case RETURNED -> "Đã gửi yêu cầu trả hàng";
            default -> order.getStatus().name();
        };
        jdbc.update("INSERT INTO auth_db.app_notifications(user_id,event_key,type,title,body,order_id) VALUES(?,?,'ORDER',?,?,?) ON DUPLICATE KEY UPDATE event_key=VALUES(event_key)",order.getUserId(),"order-"+order.getId()+"-"+order.getStatus(),"Cập nhật đơn #"+order.getId(),status,order.getId());
    }
    public Map<String,Object> mine(Long userId) {
        var rows = jdbc.queryForList("SELECT id,name,status FROM product_db.shops WHERE owner_user_id=? AND deleted_at IS NULL", userId);
        return rows.isEmpty() ? null : rows.get(0);
    }
    public Map<String,Object> open(Long userId, String name) {
        return open(userId,name,null,null);
    }
    public Map<String,Object> open(Long userId, String name, String description, String province) {
        if (name == null || name.isBlank() || name.length()>150) throw new com.team.ecommerce.shared.exception.BadRequestException("Tên shop không hợp lệ");
        if (mine(userId)==null) jdbc.update("INSERT INTO product_db.shops(owner_user_id,name,slug,description,province,status) VALUES(?,?,?,?,?,'ACTIVE')",userId,name.trim(),"shop-"+userId,description,province);
        return jdbc.queryForMap("SELECT id,name,description,province,status FROM product_db.shops WHERE owner_user_id=? AND deleted_at IS NULL",userId);
    }
    public void requireSingleShop(java.util.List<com.team.ecommerce.order.entity.CartItem> items) {
        var shopIds = items.stream().map(i -> jdbc.queryForObject("SELECT shop_id FROM product_db.products WHERE id=?",Long.class,i.getProductId())).distinct().toList();
        if (shopIds.size()!=1) throw new com.team.ecommerce.shared.exception.BadRequestException("Vui lòng đặt riêng sản phẩm của từng shop");
    }
    public boolean ownsProduct(Long userId, Long productId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM product_db.products p JOIN product_db.shops s ON s.id=p.shop_id WHERE p.id=? AND s.owner_user_id=? AND s.status='ACTIVE' AND s.deleted_at IS NULL",Long.class,productId,userId)>0;
    }
    public void requireOwner(Long userId, java.util.List<com.team.ecommerce.order.entity.OrderItem> items) {
        if (items.isEmpty() || items.stream().anyMatch(i -> !ownsProduct(userId,i.getProductId()))) throw new org.springframework.security.access.AccessDeniedException("Đơn không thuộc shop của bạn");
    }
}
