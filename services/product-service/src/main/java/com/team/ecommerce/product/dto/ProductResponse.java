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
import java.util.Map;
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
    private List<String> optionLabels;
    private Map<String, List<String>> variantImages;
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

        Long sId = product.getShopId();
        String sName = product.getShop() != null ? product.getShop().getName() : null;
        String sLoc = product.getShop() != null ? product.getShop().getProvince() : null;
        List<String> optionLabels = new ArrayList<>();
        Map<String, List<String>> variantImages = Map.of();
        if (product.getAttributes() != null && !product.getAttributes().isBlank()) {
            try {
                Map<String, Object> metadata = mapper.readValue(product.getAttributes(), new TypeReference<>() {});
                Object labels = metadata.get("optionLabels");
                if (labels != null) optionLabels = mapper.convertValue(labels, new TypeReference<List<String>>() {});
                Object imageMap = metadata.get("variantImages");
                if (imageMap != null) variantImages = mapper.convertValue(imageMap, new TypeReference<Map<String, List<String>>>() {});
            } catch (JsonProcessingException ignored) {
                // Keep optional selectors empty for legacy products with non-JSON attributes.
            }
        }

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
                .optionLabels(optionLabels)
                .variantImages(variantImages)
                .isActive(product.isActive())
                .variants(variantResponses)
                .createdAt(product.getCreatedAt())
                .build();
    }
}
