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
    @org.springframework.transaction.annotation.Transactional("orderTransactionManager")
    public Map<String,Object> register(Long user,Map<String,String> input) {
        if(jdbc.queryForObject("SELECT COUNT(*) FROM auth_db.user_roles ur JOIN auth_db.roles r ON r.id=ur.role_id WHERE ur.user_id=? AND r.code='ADMIN'",Integer.class,user)>0)throw new org.springframework.security.access.AccessDeniedException("Quản trị viên không mở shop bằng tài khoản quản trị.");
        if(mine(user)!=null)return mine(user);
        for(String key:List.of("name","province","ward","street","contactName","phone","email","description"))if(input.getOrDefault(key,"").isBlank())throw new com.team.ecommerce.shared.exception.BadRequestException("Vui lòng điền đầy đủ thông tin shop và địa chỉ lấy hàng.");
        if(!input.get("phone").matches("(?:0|\\+84)[0-9]{9,10}")||!input.get("email").matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")||!"true".equals(input.get("accepted")))throw new com.team.ecommerce.shared.exception.BadRequestException("Kiểm tra điện thoại, email và xác nhận điều khoản mở shop.");
        for(var value:input.values())if(value!=null&&value.length()>3000)throw new com.team.ecommerce.shared.exception.BadRequestException("Thông tin quá dài.");
        var shop=open(user,input.get("name"),input.get("description"),input.get("province"));long id=((Number)shop.get("id")).longValue();
        var profile=new LinkedHashMap<String,String>();for(String key:List.of("contactName","phone","email","ward","street","businessType","taxCode","returnAddress","supportPolicy","openingHours","leadDays"))profile.put(key,input.getOrDefault(key,""));
        try{jdbc.update("INSERT INTO product_db.shop_business_profiles(shop_id,profile_json) VALUES(?,?)",id,new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(profile));}catch(com.fasterxml.jackson.core.JsonProcessingException e){throw new IllegalArgumentException("Thông tin shop không hợp lệ.");}
        for(String key:List.of("logoUrl","bannerUrl")){String url=input.getOrDefault(key,"");if(!url.isBlank()&&!url.startsWith("https://"))throw new com.team.ecommerce.shared.exception.BadRequestException("Ảnh cần URL HTTPS.");}
        jdbc.update("UPDATE product_db.shops SET logo_url=?,banner_url=? WHERE id=?",input.get("logoUrl"),input.get("bannerUrl"),id);
        return shop;
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
