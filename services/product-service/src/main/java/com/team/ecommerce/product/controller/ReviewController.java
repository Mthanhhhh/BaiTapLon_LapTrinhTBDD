package com.team.ecommerce.product.controller;

import com.team.ecommerce.product.dto.ReviewRequest;
import com.team.ecommerce.product.dto.ReviewResponse;
import com.team.ecommerce.product.service.ReviewService;
import com.team.ecommerce.shared.dto.ApiResponse;
import com.team.ecommerce.shared.dto.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/products/{productId}/reviews")
@RequiredArgsConstructor
public class ReviewController {
    private final ReviewService reviewService;

    @GetMapping
    public ApiResponse<PageResponse<ReviewResponse>> getReviewsByProduct(@PathVariable Long productId, Pageable pageable) {
        return ApiResponse.success(reviewService.getReviewsByProduct(productId, pageable));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ReviewResponse> createReview(
            @PathVariable Long productId,
            @Valid @RequestBody ReviewRequest request,
            Principal principal) {
        // In real app, get user ID from token/principal. Using dummy 1L for now assuming authentication filter passes it
        Long userId = Long.valueOf(principal.getName());
        return ApiResponse.success("Review created successfully", reviewService.createReview(userId, productId, request));
    }
}
