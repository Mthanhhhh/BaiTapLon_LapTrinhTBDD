package com.team.ecommerce.product.controller;

import com.team.ecommerce.product.dto.AiChatRequest;
import com.team.ecommerce.product.dto.AiChatResponse;
import com.team.ecommerce.product.dto.ProductListResponse;
import com.team.ecommerce.product.dto.ProductSearchRequest;
import com.team.ecommerce.product.service.AiShoppingService;
import com.team.ecommerce.product.service.ProductService;
import com.team.ecommerce.shared.dto.ApiResponse;
import com.team.ecommerce.shared.dto.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiShoppingController {
    private final ProductService productService;
    private final AiShoppingService aiShoppingService;

    @GetMapping("/search")
    public ApiResponse<PageResponse<ProductListResponse>> search(@ModelAttribute ProductSearchRequest request, Pageable pageable) {
        return ApiResponse.success(productService.searchProducts(request,
                PageRequest.of(Math.max(0, pageable.getPageNumber()), Math.max(1, Math.min(pageable.getPageSize(), 50)), pageable.getSort())));
    }

    @PostMapping("/chat")
    public ApiResponse<AiChatResponse> chat(@Valid @RequestBody AiChatRequest request) {
        return ApiResponse.success(aiShoppingService.chat(request));
    }
}
