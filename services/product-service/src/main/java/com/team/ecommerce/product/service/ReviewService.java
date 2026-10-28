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

    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getReviewsByProduct(Long productId, Pageable pageable) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product", "id", productId);
        }
        Page<Review> reviews = reviewRepository.findByProductId(productId, pageable);
        // Note: in real app, we would fetch User entity to get userFullName
        return PageResponse.from(reviews.map(r -> ReviewResponse.from(r, "User " + r.getUserId())));
    }

    public ReviewResponse createReview(Long userId, Long productId, ReviewRequest request) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

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
                .orderItemId(request.getOrderId()) // Assuming same for now, or update request DTO to include orderItemId
                .reviewerName("User " + userId)
                .rating(request.getRating())
                .comment(request.getComment())
                .emotion(request.getEmotion())
                .tags(tagSet)
                .images(imageList)
                .build();

        Review savedReview = reviewRepository.save(review);

        // Recalculate average
        Double avgRating = reviewRepository.getAverageRatingByProductId(productId);
        Integer ratingCount = reviewRepository.countReviewsByProductId(productId);
        
        product.setRatingAvg(BigDecimal.valueOf(avgRating != null ? avgRating : 0.0).setScale(2, RoundingMode.HALF_UP));
        product.setRatingCount(ratingCount != null ? ratingCount : 0);
        productRepository.save(product);

        return ReviewResponse.from(savedReview, "User " + userId);
    }
}
