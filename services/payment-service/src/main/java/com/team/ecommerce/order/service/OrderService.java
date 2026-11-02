package com.team.ecommerce.order.service;

import com.team.ecommerce.order.dto.OrderResponse;
import com.team.ecommerce.shared.integration.OrderStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Slf4j
@Service
public class OrderService {

    private final RestClient restClient;

    public OrderService(@Value("${services.order.url:http://localhost:8085}") String orderServiceUrl, @Value("${INTERNAL_SERVICE_TOKEN}") String internalToken) {
        this.restClient = RestClient.builder().baseUrl(orderServiceUrl).defaultHeader("X-Service-Token",internalToken).build();
    }

    public OrderResponse getOrderById(Long userId, Long orderId) {
        log.info("Calling order-service for orderId={}, userId={}", orderId, userId);
        return restClient.get()
                .uri("/internal/orders/{id}?userId={userId}", orderId, userId)
                .retrieve()
                .body(OrderResponse.class);
    }

    public void updateOrderStatus(Long orderId, OrderStatus status) {
        log.info("Calling order-service to update status: orderId={}, status={}", orderId, status);
        restClient.put()
                .uri("/internal/orders/{id}/status?status={status}", orderId, status)
                .retrieve()
                .toBodilessEntity();
    }
}

