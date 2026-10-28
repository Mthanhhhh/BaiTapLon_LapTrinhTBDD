package com.team.ecommerce.product.service;

import com.team.ecommerce.product.entity.Product;
import com.team.ecommerce.product.entity.ProductStatus;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class ProductSpecification {
    public static Specification<Product> search(String keyword, Long categoryId, java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice, Integer minRating) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            predicates.add(cb.isNull(root.get("deletedAt")));
            predicates.add(cb.equal(root.get("status"), ProductStatus.ACTIVE));
            
            if (keyword != null && !keyword.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + keyword.toLowerCase() + "%"));
            }
            
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("categoryId"), categoryId));
            }
            
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("minPrice"), minPrice));
            }
            
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("minPrice"), maxPrice));
            }
            
            if (minRating != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("ratingAvg"), new java.math.BigDecimal(minRating)));
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
