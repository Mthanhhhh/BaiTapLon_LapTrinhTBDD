package com.team.ecommerce.product.internal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariantInternalDTO {
    private Long id;
    private String name;
    private BigDecimal price;
    private int stock;
}
