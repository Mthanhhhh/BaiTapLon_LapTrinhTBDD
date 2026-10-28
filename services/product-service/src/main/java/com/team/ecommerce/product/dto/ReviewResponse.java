package com.team.ecommerce.product.dto;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.ecommerce.product.entity.Review;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long productId;
    private Long userId;
    private String userFullName;
    private Long orderId;
    private int rating;
    private String comment;
    private String emotion;
    private List<String> tags;
    private List<String> imageUrls;
    private LocalDateTime createdAt;

    private static final ObjectMapper mapper = new ObjectMapper();

    public static ReviewResponse from(Review review, String userFullName) {
        if (review == null) return null;

        List<String> tagList = new ArrayList<>();
        if (review.getTags() != null) {
            tagList = review.getTags().stream()
                    .map(tag -> tag.getCode())
                    .collect(java.util.stream.Collectors.toList());
        }

        List<String> imageList = new ArrayList<>();
        if (review.getImages() != null) {
            imageList = review.getImages().stream()
                    .map(img -> img.getUrl())
                    .collect(java.util.stream.Collectors.toList());
        }

        return ReviewResponse.builder()
                .id(review.getId())
                .productId(review.getProductId())
                .userId(review.getUserId())
                .userFullName(review.getReviewerName() != null ? review.getReviewerName() : userFullName)
                .orderId(review.getOrderId())
                .rating(review.getRating())
                .comment(review.getComment())
                .emotion(review.getEmotion())
                .tags(tagList)
                .imageUrls(imageList)
                .createdAt(review.getCreatedAt())
                .build();
    }
}
