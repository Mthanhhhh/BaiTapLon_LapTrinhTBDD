package com.team.ecommerce.product.dto;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.ecommerce.product.entity.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private Long categoryId;
    private String categoryName;
    private Long shopId;
    private String shopName;
    private String shopLocation;
    private String thumbnailUrl;
    private List<String> images;
    private int stock;
    private BigDecimal rating;
    private int ratingCount;
    private int soldCount;
    private String attributes;
    private boolean isActive;
    private List<ProductVariantResponse> variants;
    private LocalDateTime createdAt;

    private static final ObjectMapper mapper = new ObjectMapper();

    public static ProductResponse from(Product product, String categoryName) {
        if (product == null) return null;
        
        List<String> imageList = new ArrayList<>();
        if (product.getImages() != null) {
            imageList = product.getImages().stream()
                    .map(img -> img.getUrl())
                    .collect(Collectors.toList());
        }

        List<ProductVariantResponse> variantResponses = new ArrayList<>();
        int totalStock = 0;
        if (product.getVariants() != null) {
            variantResponses = product.getVariants().stream()
                    .map(ProductVariantResponse::from)
                    .collect(Collectors.toList());
            totalStock = product.getVariants().stream().mapToInt(v -> v.getStock()).sum();
        }

        Long sId = product.getShopId() != null ? product.getShopId() : 1L;
        String sName = (sId == 1L) ? "TechZone Official" : (sId == 2L ? "Daily Mart" : "Shop #" + sId);
        String sLoc = (sId == 2L) ? "Hà Nội" : "TP. Hồ Chí Minh";

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getMinPrice())
                .originalPrice(product.getOriginalPrice())
                .categoryId(product.getCategoryId())
                .categoryName(categoryName)
                .shopId(sId)
                .shopName(sName)
                .shopLocation(sLoc)
                .thumbnailUrl(product.getThumbnailUrl())
                .images(imageList)
                .stock(totalStock)
                .rating(product.getRatingAvg())
                .ratingCount(product.getRatingCount())
                .soldCount(product.getSoldCount())
                .attributes(product.getAttributes())
                .isActive(product.isActive())
                .variants(variantResponses)
                .createdAt(product.getCreatedAt())
                .build();
    }
}
