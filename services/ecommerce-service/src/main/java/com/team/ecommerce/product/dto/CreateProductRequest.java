package com.team.ecommerce.product.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CreateProductRequest {
    @NotBlank(message = "Name is required")
    private String name;

    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;

    private BigDecimal originalPrice;

    @NotNull(message = "CategoryId is required")
    private Long categoryId;

    private String thumbnailUrl;

    private List<String> images;

    @Min(value = 0, message = "Stock cannot be negative")
    private int stock;

    private String attributes;

    @Valid
    private List<ProductVariantRequest> variants;
}
