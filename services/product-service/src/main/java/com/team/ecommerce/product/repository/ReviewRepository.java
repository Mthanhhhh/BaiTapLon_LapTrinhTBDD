package com.team.ecommerce.product.repository;

import com.team.ecommerce.product.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    Page<Review> findByProductId(Long productId, Pageable pageable);
    
    boolean existsByUserIdAndOrderIdAndProductId(Long userId, Long orderId, Long productId);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.productId = :productId")
    Double getAverageRatingByProductId(@Param("productId") Long productId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.productId = :productId AND r.status = 'VISIBLE'")
    Double getAverageVisibleRatingByProductId(@Param("productId") Long productId);
    
    @Query("SELECT COUNT(r) FROM Review r WHERE r.productId = :productId")
    Integer countReviewsByProductId(@Param("productId") Long productId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.productId = :productId AND r.status = 'VISIBLE'")
    Integer countVisibleReviewsByProductId(@Param("productId") Long productId);
}
