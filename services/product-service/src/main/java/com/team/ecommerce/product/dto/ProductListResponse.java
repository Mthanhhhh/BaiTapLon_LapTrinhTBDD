package com.team.ecommerce.product.dto;

import com.team.ecommerce.product.entity.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductListResponse {
    private Long id;
    private String name;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private String thumbnailUrl;
    private BigDecimal rating;
    private int ratingCount;
    private int soldCount;
    private int stock;
    private String categoryName;
    private Long shopId;
    private String shopName;
    private String shopLocation;

    public static ProductListResponse from(Product product, String categoryName) {
        if (product == null) return null;
        int totalStock = product.getVariants() != null ? 
                product.getVariants().stream().mapToInt(v -> v.getStock()).sum() : 0;
        
        Long sId = product.getShopId();
        String sName = product.getShop() != null ? product.getShop().getName() : null;
        String sLoc = product.getShop() != null ? product.getShop().getProvince() : null;

        return ProductListResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .price(product.getMinPrice())
                .originalPrice(product.getOriginalPrice())
                .thumbnailUrl(product.getThumbnailUrl())
                .rating(product.getRatingAvg())
                .ratingCount(product.getRatingCount())
                .soldCount(product.getSoldCount())
                .stock(totalStock)
                .categoryName(categoryName)
                .shopId(sId)
                .shopName(sName)
                .shopLocation(sLoc)
                .build();
    }
}
