package com.team.ecommerce.order.controller;

import com.team.ecommerce.order.dto.CreateOrderRequest;
import com.team.ecommerce.order.dto.OrderResponse;
import com.team.ecommerce.order.entity.OrderStatus;
import com.team.ecommerce.order.service.OrderService;
import com.team.ecommerce.shared.dto.ApiResponse;
import com.team.ecommerce.shared.dto.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final com.team.ecommerce.order.service.ShopAccessService shops;

    @GetMapping("/shop/me")
    public ApiResponse<java.util.Map<String,Object>> shop(@AuthenticationPrincipal Long userId) { return ApiResponse.success(shops.mine(userId)); }

    @PostMapping("/shop/me")
    public ApiResponse<java.util.Map<String,Object>> openShop(@AuthenticationPrincipal Long userId, @RequestBody java.util.Map<String,String> body) { return ApiResponse.success(shops.open(userId, body.get("name"))); }

    @GetMapping("/shop/orders")
    public ApiResponse<PageResponse<OrderResponse>> shopOrders(@AuthenticationPrincipal Long userId, Pageable pageable) { return ApiResponse.success(orderService.getShopOrders(userId, pageable)); }

    @PostMapping
    public ApiResponse<OrderResponse> createOrder(@AuthenticationPrincipal Long userId, @Valid @RequestBody CreateOrderRequest request) {
        return ApiResponse.success("Order created successfully", orderService.createOrder(userId, request));
    }

    @GetMapping
    public ApiResponse<PageResponse<OrderResponse>> getOrders(@AuthenticationPrincipal Long userId, Pageable pageable) {
        return ApiResponse.success(orderService.getOrders(userId, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderResponse> getOrderById(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        return ApiResponse.success(orderService.getOrderById(userId, id));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<OrderResponse> cancelOrder(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        return ApiResponse.success("Order cancelled", orderService.cancelOrder(userId, id));
    }

    @PostMapping("/{id}/confirm")
    public ApiResponse<OrderResponse> confirmOrder(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        return ApiResponse.success("Order confirmed by shop", orderService.transition(userId, id, OrderStatus.WAITING_PICKUP));
    }

    @PostMapping("/{id}/ship")
    public ApiResponse<OrderResponse> shipOrder(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        return ApiResponse.success("Order handed to shipping", orderService.transition(userId, id, OrderStatus.SHIPPING));
    }

    @PostMapping("/{id}/receive")
    public ApiResponse<OrderResponse> receiveOrder(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        return ApiResponse.success("Order delivered successfully", orderService.transition(userId, id, OrderStatus.DELIVERED));
    }

    @PostMapping("/{id}/return")
    public ApiResponse<OrderResponse> returnOrder(@AuthenticationPrincipal Long userId, @PathVariable Long id) {
        return ApiResponse.success("Order return requested", orderService.transition(userId, id, OrderStatus.RETURNED));
    }
}
