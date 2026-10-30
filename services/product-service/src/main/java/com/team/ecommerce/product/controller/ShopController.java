package com.team.ecommerce.product.controller;

import com.team.ecommerce.shared.dto.ApiResponse;
import com.team.ecommerce.shared.exception.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/products/shops")
@RequiredArgsConstructor
public class ShopController {
    private final JdbcTemplate jdbc;

    public record ShopProfileInput(String name, String description, String province) {}
    public record SkuInput(String name, String skuCode, BigDecimal price, BigDecimal originalPrice, Integer stock, List<String> images) {}
    public record ShopProductInput(String name, String description, Long categoryId, BigDecimal price,
                                   BigDecimal originalPrice, Integer stock, String thumbnailUrl,
                                   List<String> images, List<SkuInput> variants) {}

    @GetMapping("/me")
    public ApiResponse<Map<String,Object>> mine(@AuthenticationPrincipal Long userId) {
        var rows = jdbc.queryForList("SELECT id,owner_user_id AS ownerUserId,name,description,province,status,logo_url AS logoUrl,banner_url AS bannerUrl FROM shops WHERE owner_user_id=? AND deleted_at IS NULL", userId);
        return ApiResponse.success(rows.isEmpty() ? null : rows.get(0));
    }

    private void requireOwner(Long shopId, Long userId) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM shops WHERE id=? AND owner_user_id=? AND deleted_at IS NULL", Integer.class, shopId, userId);
        if (count == null || count == 0) throw new AccessDeniedException("Shop belongs to another user");
    }

    @PutMapping("/{id}/profile")
    @Transactional("productTransactionManager")
    public ApiResponse<Map<String,Object>> updateProfile(@PathVariable Long id, @AuthenticationPrincipal Long userId, @RequestBody ShopProfileInput input) {
        requireOwner(id, userId);
        if (input.name() == null || input.name().isBlank() || input.name().length() > 150) throw new BadRequestException("Tên shop không hợp lệ");
        jdbc.update("UPDATE shops SET name=?,description=?,province=? WHERE id=?", input.name().trim(), input.description(), input.province(), id);
        return ApiResponse.success(shop(id));
    }

    @GetMapping("/{id}/manage/products")
    public ApiResponse<List<Map<String,Object>>> manageProducts(@PathVariable Long id, @AuthenticationPrincipal Long userId) {
        requireOwner(id, userId);
        return ApiResponse.success(jdbc.queryForList("SELECT p.id,p.name,p.description,p.category_id AS categoryId,p.min_price AS price,p.original_price AS originalPrice,p.thumbnail_url AS thumbnailUrl,p.status,p.sold_count AS soldCount,COALESCE(SUM(k.stock_quantity),0) AS stock FROM products p LEFT JOIN product_skus k ON k.product_id=p.id AND k.deleted_at IS NULL WHERE p.shop_id=? AND p.deleted_at IS NULL GROUP BY p.id ORDER BY p.created_at DESC", id));
    }

    @PostMapping("/{id}/products")
    @Transactional("productTransactionManager")
    public ApiResponse<Map<String,Object>> createProduct(@PathVariable Long id, @AuthenticationPrincipal Long userId, @RequestBody ShopProductInput input) {
        requireOwner(id, userId);
        if (input.name()==null||input.name().isBlank()||input.name().length()>255||input.categoryId()==null) throw new BadRequestException("Vui lòng kiểm tra tên và danh mục sản phẩm");
        if (jdbc.queryForObject("SELECT COUNT(*) FROM categories WHERE id=? AND is_active=1", Integer.class, input.categoryId()) == 0) throw new BadRequestException("Danh mục không tồn tại hoặc đang tạm khóa");
        List<SkuInput> skus=input.variants()==null?List.of():input.variants();
        if(skus.isEmpty()&&input.price()!=null&&input.stock()!=null)skus=List.of(new SkuInput("Mặc định",null,input.price(),input.originalPrice(),input.stock(),List.of()));
        if(skus.isEmpty()||skus.size()>100||skus.stream().anyMatch(s->s.name()==null||s.name().isBlank()||s.price()==null||s.price().signum()<=0||s.stock()==null||s.stock()<0))throw new BadRequestException("Mỗi phân loại cần tên, giá lớn hơn 0 và tồn kho không âm");
        String slug = input.name().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "") + "-" + UUID.randomUUID().toString().substring(0,8);
        BigDecimal minPrice=skus.stream().map(SkuInput::price).min(BigDecimal::compareTo).orElseThrow();
        BigDecimal maxPrice=skus.stream().map(SkuInput::price).max(BigDecimal::compareTo).orElseThrow();
        BigDecimal original=skus.get(0).originalPrice()==null?skus.get(0).price():skus.get(0).originalPrice();
        LinkedHashMap<String,List<String>> variantImages=new LinkedHashMap<>();
        for(SkuInput sku:skus)if(sku.images()!=null&&!sku.images().isEmpty())variantImages.put(sku.name().trim(),sku.images().stream().filter(u->u!=null&&!u.isBlank()).distinct().toList());
        List<String> gallery=input.images()==null?new ArrayList<>():input.images().stream().filter(u->u!=null&&!u.isBlank()).distinct().collect(java.util.stream.Collectors.toCollection(ArrayList::new));
        for(List<String> urls:variantImages.values())for(String url:urls)if(!gallery.contains(url))gallery.add(url);
        String image=input.thumbnailUrl(); if((image==null||image.isBlank())&&!gallery.isEmpty())image=gallery.get(0);
        String attributes;
        try { attributes=new ObjectMapper().writeValueAsString(Map.of("optionLabels",List.of("Phân loại"),"variantImages",variantImages)); }
        catch(com.fasterxml.jackson.core.JsonProcessingException e){ throw new BadRequestException("Không thể lưu thư viện ảnh sản phẩm"); }
        jdbc.update("INSERT INTO products(shop_id,category_id,name,slug,short_description,description,thumbnail_url,currency,min_price,max_price,original_price,attributes,status) VALUES(?,?,?,?,?,?,?,'VND',?,?,?,?,'ACTIVE')",id,input.categoryId(),input.name().trim(),slug,input.description(),input.description(),image,minPrice,maxPrice,original,attributes);
        Long productId = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        for(int i=0;i<gallery.size();i++) jdbc.update("INSERT INTO product_images(product_id,url,sort_order,is_primary) VALUES(?,?,?,?)",productId,gallery.get(i),i,i==0);
        for(SkuInput sku:skus){
            String code=sku.skuCode()==null||sku.skuCode().isBlank()?"SELLER-"+productId+"-"+UUID.randomUUID().toString().substring(0,8).toUpperCase(Locale.ROOT):sku.skuCode().trim();
            jdbc.update("INSERT INTO product_skus(product_id,sku_code,name,price,original_price,stock_quantity,status) VALUES(?,?,?,?,?,?,'ACTIVE')",productId,code,sku.name().trim(),sku.price(),sku.originalPrice()==null?sku.price():sku.originalPrice(),sku.stock());
        }
        return ApiResponse.success(jdbc.queryForMap("SELECT id,name,min_price AS price,thumbnail_url AS thumbnailUrl,status FROM products WHERE id=?",productId));
    }

    @PatchMapping("/{shopId}/products/{productId}/status")
    @Transactional("productTransactionManager")
    public ApiResponse<Map<String,Object>> changeProductStatus(@PathVariable Long shopId, @PathVariable Long productId, @AuthenticationPrincipal Long userId, @RequestParam String status) {
        requireOwner(shopId,userId);
        if (!List.of("ACTIVE","HIDDEN","DRAFT").contains(status)) throw new BadRequestException("Trạng thái sản phẩm không hợp lệ");
        int changed=jdbc.update("UPDATE products SET status=? WHERE id=? AND shop_id=? AND deleted_at IS NULL",status,productId,shopId);
        if(changed==0)throw new ResourceNotFoundException("Product","id",productId);
        return ApiResponse.success(jdbc.queryForMap("SELECT id,name,status FROM products WHERE id=?",productId));
    }
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
