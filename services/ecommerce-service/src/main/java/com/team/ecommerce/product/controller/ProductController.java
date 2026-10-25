package com.team.ecommerce.product.controller;

import com.team.ecommerce.product.dto.*;
import com.team.ecommerce.product.service.ProductService;
import com.team.ecommerce.shared.dto.ApiResponse;
import com.team.ecommerce.shared.dto.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;

    @GetMapping
    public ApiResponse<PageResponse<ProductListResponse>> getProducts(Pageable pageable) {
        return ApiResponse.success(productService.getProducts(pageable));
    }

    @GetMapping("/search")
    public ApiResponse<PageResponse<ProductListResponse>> searchProducts(@ModelAttribute ProductSearchRequest request, Pageable pageable) {
        return ApiResponse.success(productService.searchProducts(request, pageable));
    }

    @GetMapping("/best-sales")
    public ApiResponse<PageResponse<ProductListResponse>> getBestSales(Pageable pageable) {
        return ApiResponse.success(productService.getBestSales(pageable));
    }

    @GetMapping("/popular")
    public ApiResponse<PageResponse<ProductListResponse>> getPopular(Pageable pageable) {
        return ApiResponse.success(productService.getPopular(pageable));
    }

    @GetMapping("/category/{categoryId}")
    public ApiResponse<PageResponse<ProductListResponse>> getProductsByCategory(@PathVariable Long categoryId, Pageable pageable) {
        return ApiResponse.success(productService.getProductsByCategory(categoryId, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductResponse> getProductById(@PathVariable Long id) {
        return ApiResponse.success(productService.getProductById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ProductResponse> createProduct(@Valid @RequestBody CreateProductRequest request) {
        return ApiResponse.success("Product created successfully", productService.createProduct(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ProductResponse> updateProduct(@PathVariable Long id, @Valid @RequestBody UpdateProductRequest request) {
        return ApiResponse.success("Product updated successfully", productService.updateProduct(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ApiResponse.success("Product deleted successfully", null);
    }
}
