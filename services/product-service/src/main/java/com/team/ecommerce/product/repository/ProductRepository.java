package com.team.ecommerce.product.repository;

import com.team.ecommerce.product.entity.Product;
import com.team.ecommerce.product.entity.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    Page<Product> findByDeletedAtIsNullAndStatus(ProductStatus status, Pageable pageable);
    
    Page<Product> findByCategoryIdInAndDeletedAtIsNullAndStatus(Collection<Long> categoryIds, ProductStatus status, Pageable pageable);
    
    Optional<Product> findByIdAndDeletedAtIsNull(Long id);
    
    Page<Product> findByDeletedAtIsNullAndStatusAndSoldCountGreaterThanOrderBySoldCountDesc(ProductStatus status, int soldCount, Pageable pageable);
    
    Page<Product> findByDeletedAtIsNullAndStatusOrderByRatingAvgDesc(ProductStatus status, Pageable pageable);
}
