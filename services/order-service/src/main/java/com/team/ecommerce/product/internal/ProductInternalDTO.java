package com.team.ecommerce.product.internal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductInternalDTO {
    private Long id;
    private Long shopId;
    private String name;
    private BigDecimal price;
    private String thumbnailUrl;
    private int stock;
    private boolean active;
    private List<VariantInternalDTO> variants;
}
