package com.team.ecommerce.product.dto;

import com.team.ecommerce.product.entity.ProductVariant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantResponse {
    private Long id;
    private String name;
    private String sku;
    private BigDecimal price;
    private int stock;

    public static ProductVariantResponse from(ProductVariant variant) {
        if (variant == null) return null;
        return ProductVariantResponse.builder()
                .id(variant.getId())
                .name(variant.getName())
                .sku(variant.getSku())
                .price(variant.getPrice())
                .stock(variant.getStock())
                .build();
    }
}
