package com.team.ecommerce.product.internal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Slf4j
@Service
public class ProductInternalService {

    private final RestClient restClient;

    public ProductInternalService(@Value("${services.product.url:http://localhost:8084}") String productServiceUrl) {
        this.restClient = RestClient.builder().baseUrl(productServiceUrl).build();
    }

    public ProductInternalDTO getProductById(Long productId) {
        log.info("Calling product-service for productId={}", productId);
        return restClient.get()
                .uri("/internal/products/{id}", productId)
                .retrieve()
                .body(ProductInternalDTO.class);
    }

    public VariantInternalDTO getVariantById(Long variantId) {
        log.info("Calling product-service for variantId={}", variantId);
        return restClient.get()
                .uri("/internal/products/variants/{variantId}", variantId)
                .retrieve()
                .body(VariantInternalDTO.class);
    }

    public void deductStock(Long productId, Long variantId, int quantity) {
        log.info("Calling product-service to deduct stock: prodId={}, variantId={}, qty={}", productId, variantId, quantity);
        restClient.post()
                .uri("/internal/products/deduct-stock")
                .body(new DeductStockRequest(productId, variantId, quantity))
                .retrieve()
                .toBodilessEntity();
    }

    public void restoreStock(Long productId, Long variantId, int quantity) {
        log.info("Calling product-service to restore stock: prodId={}, variantId={}, qty={}", productId, variantId, quantity);
        restClient.post()
                .uri("/internal/products/restore-stock")
                .body(new DeductStockRequest(productId, variantId, quantity))
                .retrieve()
                .toBodilessEntity();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeductStockRequest {
        private Long productId;
        private Long variantId;
        private int quantity;
    }
}
