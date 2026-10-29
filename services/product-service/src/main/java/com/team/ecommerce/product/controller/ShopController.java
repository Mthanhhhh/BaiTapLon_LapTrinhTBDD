package com.team.ecommerce.product.controller;

import com.team.ecommerce.shared.dto.ApiResponse;
import com.team.ecommerce.shared.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/products/shops")
@RequiredArgsConstructor
public class ShopController {
    private final JdbcTemplate jdbc;
    private Map<String,Object> shop(Long id) {
        var rows=jdbc.queryForList("SELECT id,owner_user_id AS ownerUserId,name,logo_url AS logoUrl,banner_url AS bannerUrl,description,province,created_at AS createdAt FROM shops WHERE id=? AND status='ACTIVE' AND deleted_at IS NULL",id);
        if(rows.isEmpty()) throw new ResourceNotFoundException("Shop","id",id);
        return rows.get(0);
    }
    @GetMapping("/{id}")
    public ApiResponse<Map<String,Object>> detail(@PathVariable Long id) {
        var data=shop(id);
        data.putAll(jdbc.queryForMap("SELECT COUNT(*) AS productCount,COALESCE(SUM(sold_count),0) AS soldCount FROM products WHERE shop_id=? AND status='ACTIVE' AND deleted_at IS NULL",id));
        data.putAll(jdbc.queryForMap("SELECT COUNT(*) AS reviewCount,COALESCE(AVG(r.rating),0) AS rating FROM reviews r JOIN products p ON p.id=r.product_id WHERE p.shop_id=? AND r.status='VISIBLE' AND r.deleted_at IS NULL",id));
        data.put("collections",collections(id));
        return ApiResponse.success(data);
    }
    private List<Map<String,Object>> collections(Long id) {
        var rows=jdbc.queryForList("SELECT id,name FROM shop_collections WHERE shop_id=? ORDER BY sort_order,id",id);
        for(var row:rows) row.put("productIds",jdbc.queryForList("SELECT product_id FROM shop_collection_products WHERE collection_id=?",Long.class,row.get("id")));
        return rows;
    }
    @GetMapping("/{id}/products")
    public ApiResponse<Map<String,Object>> products(@PathVariable Long id,@RequestParam(defaultValue="sold") String sort,@RequestParam(defaultValue="") String keyword,@RequestParam(required=false) Long collectionId,@RequestParam(required=false) BigDecimal minPrice,@RequestParam(required=false) BigDecimal maxPrice,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {
        shop(id); size=Math.max(1,Math.min(size,100));page=Math.max(0,page);
        String where=" FROM products p WHERE p.shop_id=? AND p.status='ACTIVE' AND p.deleted_at IS NULL";
        List<Object> args=new ArrayList<>();args.add(id);
        if(!keyword.isBlank()){where+=" AND p.name LIKE ?";args.add("%"+keyword.trim()+"%");}
        if(collectionId!=null){where+=" AND EXISTS(SELECT 1 FROM shop_collection_products cp JOIN shop_collections c ON c.id=cp.collection_id WHERE cp.product_id=p.id AND c.id=? AND c.shop_id=p.shop_id)";args.add(collectionId);}
        if(minPrice!=null){where+=" AND p.min_price>=?";args.add(minPrice);}
        if(maxPrice!=null){where+=" AND p.min_price<=?";args.add(maxPrice);}
        Long total=jdbc.queryForObject("SELECT COUNT(*)"+where,Long.class,args.toArray());
        String order=switch(sort){case "popular"->"p.view_count DESC";case "priceAsc"->"p.min_price ASC";case "priceDesc"->"p.min_price DESC";case "rating"->"p.rating_avg DESC";case "new"->"p.created_at DESC";default->"p.sold_count DESC";};
        args.add(size);args.add(page*size);
        var rows=jdbc.queryForList("SELECT p.id,p.name,p.min_price AS price,p.original_price AS originalPrice,p.thumbnail_url AS thumbnailUrl,p.rating_avg AS rating,p.sold_count AS soldCount,p.shop_id AS shopId"+where+" ORDER BY "+order+",p.id DESC LIMIT ? OFFSET ?",args.toArray());
        return ApiResponse.success(Map.of("content",rows,"totalElements",total,"page",page,"last",((long)page+1)*size>=total));
    }
    @GetMapping("/{id}/reviews")
    public ApiResponse<List<Map<String,Object>>> reviews(@PathVariable Long id,@RequestParam(defaultValue="0") int page) {
        shop(id);
        return ApiResponse.success(jdbc.queryForList("SELECT r.id,r.product_id AS productId,p.name AS productName,r.reviewer_name AS userName,r.rating,r.content AS comment,r.created_at AS createdAt FROM reviews r JOIN products p ON p.id=r.product_id WHERE p.shop_id=? AND r.status='VISIBLE' AND r.deleted_at IS NULL ORDER BY r.created_at DESC,r.id DESC LIMIT 20 OFFSET ?",id,Math.max(0,page)*20));
    }
    public record CollectionInput(String name,List<Long> productIds) {}
    @PutMapping("/{id}/collections")
    @Transactional("productTransactionManager")
    public ApiResponse<List<Map<String,Object>>> save(@PathVariable Long id,@AuthenticationPrincipal Long userId,@RequestBody List<CollectionInput> input) {
        if(!Objects.equals(((Number)shop(id).get("ownerUserId")).longValue(),userId))throw new AccessDeniedException("Shop belongs to another user");
        if(input.size()>30)throw new BadRequestException("Tối đa 30 danh mục");
        for(var c:input){
            if(c.name()==null||c.name().isBlank()||c.name().length()>100||c.productIds()==null||c.productIds().size()>500)throw new BadRequestException("Danh mục không hợp lệ");
            for(Long pid:c.productIds())if(jdbc.queryForObject("SELECT COUNT(*) FROM products WHERE id=? AND shop_id=? AND deleted_at IS NULL",Long.class,pid,id)!=1)throw new BadRequestException("Sản phẩm không thuộc shop");
        }
        jdbc.update("DELETE FROM shop_collections WHERE shop_id=?",id);
        int pos=0;
        for(var c:input){
            jdbc.update("INSERT INTO shop_collections(shop_id,name,sort_order) VALUES(?,?,?)",id,c.name().trim(),pos++);
            Long cid=jdbc.queryForObject("SELECT LAST_INSERT_ID()",Long.class);
            for(Long pid:new LinkedHashSet<>(c.productIds()))jdbc.update("INSERT INTO shop_collection_products(collection_id,product_id) VALUES(?,?)",cid,pid);
        }
        return ApiResponse.success(collections(id));
    }
}
