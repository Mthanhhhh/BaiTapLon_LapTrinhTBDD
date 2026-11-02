package com.team.ecommerce.product.service;

import com.team.ecommerce.product.dto.ReviewRequest;
import com.team.ecommerce.product.dto.ReviewResponse;
import com.team.ecommerce.product.entity.FeedbackTag;
import com.team.ecommerce.product.entity.Product;
import com.team.ecommerce.product.entity.Review;
import com.team.ecommerce.product.entity.ReviewImage;
import com.team.ecommerce.product.repository.FeedbackTagRepository;
import com.team.ecommerce.product.repository.ProductRepository;
import com.team.ecommerce.product.repository.ReviewRepository;
import com.team.ecommerce.shared.dto.PageResponse;
import com.team.ecommerce.shared.exception.BadRequestException;
import com.team.ecommerce.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional("productTransactionManager")
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final FeedbackTagRepository feedbackTagRepository;
    private final JdbcTemplate jdbc;
    private final com.team.ecommerce.shared.integration.IntegrationClient clients;
    private final com.team.ecommerce.shared.integration.DomainOutbox outbox;

    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getReviewsByProduct(Long productId, Pageable pageable) {
        return getReviewsByProduct(productId,null,pageable);
    }

    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getReviewsByProduct(Long productId,Integer rating,Pageable pageable) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product", "id", productId);
        }
        if(rating!=null&&(rating<1||rating>5))throw new BadRequestException("Số sao phải từ 1 đến 5");
        Page<Review> reviews = rating==null?reviewRepository.findByProductIdAndStatus(productId,"VISIBLE",pageable):reviewRepository.findByProductIdAndRatingAndStatus(productId,rating,"VISIBLE",pageable);
        return PageResponse.from(reviews.map(r -> ReviewResponse.from(r, "User " + r.getUserId())));
    }

    @Transactional(readOnly = true)
    public java.util.Map<String,Object> summary(Long productId){
        if(!productRepository.existsById(productId))throw new ResourceNotFoundException("Product","id",productId);
        var row=jdbc.queryForMap("SELECT COUNT(*) AS total,COALESCE(ROUND(AVG(rating),2),0) AS average FROM reviews WHERE product_id=? AND status='VISIBLE' AND deleted_at IS NULL",productId);
        row.put("stars",jdbc.queryForList("SELECT rating,COUNT(*) AS count FROM reviews WHERE product_id=? AND status='VISIBLE' AND deleted_at IS NULL GROUP BY rating ORDER BY rating DESC",productId));return row;
    }

    @CacheEvict(value = "products", key = "'id:' + #productId")
    public ReviewResponse createReview(Long userId, Long productId, ReviewRequest request) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        var eligibleItems=(List<java.util.Map<String,Object>>)clients.get("order","/internal/domain/review-proof?user="+userId+"&order="+request.getOrderId()+"&product="+productId).get("items");
        if (eligibleItems.isEmpty()) {
            throw new BadRequestException("Chỉ có thể đánh giá sản phẩm thuộc đơn hàng đã giao thành công");
        }

        if (reviewRepository.existsByUserIdAndOrderIdAndProductId(userId, request.getOrderId(), productId)) {
            throw new BadRequestException("User has already reviewed this product for this order");
        }

        Set<FeedbackTag> tagSet = new HashSet<>();
        if (request.getTags() != null && !request.getTags().isEmpty()) {
            List<FeedbackTag> tags = feedbackTagRepository.findByCodeIn(request.getTags());
            tagSet.addAll(tags);
        }

        List<ReviewImage> imageList = new ArrayList<>();
        if (request.getImageUrls() != null) {
            for (int i = 0; i < request.getImageUrls().size(); i++) {
                imageList.add(ReviewImage.builder()
                        .url(request.getImageUrls().get(i))
                        .sortOrder(i)
                        .build());
            }
        }

        Review review = Review.builder()
                .productId(productId)
                .userId(userId)
                .orderId(request.getOrderId())
                .orderItemId(((Number)eligibleItems.get(0).get("id")).longValue())
                .skuId(((Number)eligibleItems.get(0).get("sku_id")).longValue())
                .reviewerName(clients.account(userId).get("fullName").toString())
                .rating(request.getRating())
                .comment(request.getComment())
                .emotion(request.getEmotion())
                .tags(tagSet)
                .images(imageList)
                .build();

        Review savedReview = reviewRepository.save(review);

        // Recalculate average
        Double avgRating = reviewRepository.getAverageVisibleRatingByProductId(productId);
        Integer ratingCount = reviewRepository.countVisibleReviewsByProductId(productId);
        
        product.setRatingAvg(BigDecimal.valueOf(avgRating != null ? avgRating : 0.0).setScale(2, RoundingMode.HALF_UP));
        product.setRatingCount(ratingCount != null ? ratingCount : 0);
        productRepository.save(product);
        outbox.enqueue("order","review-recorded",java.util.Map.of("orderItemId",savedReview.getOrderItemId()),"review:"+savedReview.getId());

        return ReviewResponse.from(savedReview, savedReview.getReviewerName());
    }
}
