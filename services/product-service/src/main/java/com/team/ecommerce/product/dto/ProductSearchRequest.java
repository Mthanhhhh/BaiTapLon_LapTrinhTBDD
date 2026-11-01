package com.team.ecommerce.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductSearchRequest {
    private String keyword;
    private Long categoryId;
    private Long brandId;
    private String province;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Integer minRating;
    private String sortBy; // price, rating, soldCount, createdAt
    private String sortDir; // asc, desc
}
