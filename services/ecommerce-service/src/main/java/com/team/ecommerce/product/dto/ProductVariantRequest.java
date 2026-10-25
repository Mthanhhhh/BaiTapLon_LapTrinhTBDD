package com.team.ecommerce.product.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantRequest {
    @NotBlank(message = "Variant name is required")
    private String name;

    private String sku;

    @NotNull(message = "Variant price is required")
    private BigDecimal price;

    @Min(value = 0, message = "Variant stock cannot be negative")
    private int stock;

    private String attributes;
}
