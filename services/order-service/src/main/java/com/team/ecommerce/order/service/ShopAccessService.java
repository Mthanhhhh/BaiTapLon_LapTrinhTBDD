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
    public Map<String,Object> mine(Long userId) {
        var rows = jdbc.queryForList("SELECT id,name,status FROM product_db.shops WHERE owner_user_id=? AND deleted_at IS NULL", userId);
        return rows.isEmpty() ? null : rows.get(0);
    }
    public Map<String,Object> open(Long userId, String name) {
        if (name == null || name.isBlank() || name.length()>150) throw new com.team.ecommerce.shared.exception.BadRequestException("Tên shop không hợp lệ");
        if (mine(userId)==null) jdbc.update("INSERT INTO product_db.shops(owner_user_id,name,slug,status) VALUES(?,?,?,'ACTIVE')",userId,name.trim(),"shop-"+userId);
        return mine(userId);
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
