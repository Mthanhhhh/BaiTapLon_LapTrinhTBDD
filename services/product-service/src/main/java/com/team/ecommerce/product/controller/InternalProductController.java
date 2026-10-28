package com.team.ecommerce.product.controller;

import com.team.ecommerce.product.internal.ProductInternalDTO;
import com.team.ecommerce.product.internal.ProductInternalService;
import com.team.ecommerce.product.internal.VariantInternalDTO;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/products")
@RequiredArgsConstructor
public class InternalProductController {

    private final ProductInternalService productInternalService;

    @GetMapping("/{id}")
    public ProductInternalDTO getProductById(@PathVariable("id") Long id) {
        return productInternalService.getProductById(id);
    }

    @GetMapping("/variants/{variantId}")
    public VariantInternalDTO getVariantById(@PathVariable("variantId") Long variantId) {
        return productInternalService.getVariantById(variantId);
    }

    @PostMapping("/deduct-stock")
    public void deductStock(@RequestBody DeductStockRequest request) {
        productInternalService.deductStock(request.getProductId(), request.getVariantId(), request.getQuantity());
    }

    @PostMapping("/restore-stock")
    public void restoreStock(@RequestBody DeductStockRequest request) {
        productInternalService.restoreStock(request.getProductId(), request.getVariantId(), request.getQuantity());
    }

    @Data
    public static class DeductStockRequest {
        private Long productId;
        private Long variantId;
        private int quantity;
    }
}
