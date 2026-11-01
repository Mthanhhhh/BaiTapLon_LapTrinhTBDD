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
    @org.springframework.data.jpa.repository.Query("SELECT p FROM Product p JOIN p.shop s WHERE p.deletedAt IS NULL AND p.status=:status AND s.status='ACTIVE' AND s.deletedAt IS NULL")
    Page<Product> findByDeletedAtIsNullAndStatus(ProductStatus status, Pageable pageable);
    
    @org.springframework.data.jpa.repository.Query("SELECT p FROM Product p JOIN p.shop s WHERE p.categoryId IN :categoryIds AND p.deletedAt IS NULL AND p.status=:status AND s.status='ACTIVE' AND s.deletedAt IS NULL")
    Page<Product> findByCategoryIdInAndDeletedAtIsNullAndStatus(Collection<Long> categoryIds, ProductStatus status, Pageable pageable);
    
    Optional<Product> findByIdAndDeletedAtIsNull(Long id);
    
    @org.springframework.data.jpa.repository.Query("SELECT p FROM Product p JOIN p.shop s WHERE p.deletedAt IS NULL AND p.status=:status AND p.soldCount>:soldCount AND s.status='ACTIVE' AND s.deletedAt IS NULL ORDER BY p.soldCount DESC")
    Page<Product> findByDeletedAtIsNullAndStatusAndSoldCountGreaterThanOrderBySoldCountDesc(ProductStatus status, int soldCount, Pageable pageable);
    
    @org.springframework.data.jpa.repository.Query("SELECT p FROM Product p JOIN p.shop s WHERE p.deletedAt IS NULL AND p.status=:status AND s.status='ACTIVE' AND s.deletedAt IS NULL ORDER BY p.ratingAvg DESC")
    Page<Product> findByDeletedAtIsNullAndStatusOrderByRatingAvgDesc(ProductStatus status, Pageable pageable);
}
