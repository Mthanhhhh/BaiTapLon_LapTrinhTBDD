package com.team.ecommerce.product.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
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
public class UpdateProductRequest {
    private String name;

    private String description;

    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;

    private BigDecimal originalPrice;

    private Long categoryId;

    private String thumbnailUrl;

    private List<String> images;

    @Min(value = 0, message = "Stock cannot be negative")
    private Integer stock;

    private String attributes;

    @Valid
    private List<ProductVariantRequest> variants;
}
