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

    @PutMapping("/{id}/status")
    public ApiResponse<OrderResponse> updateOrderStatus(@PathVariable Long id, @RequestParam OrderStatus status) {
        return ApiResponse.success("Order status updated", orderService.updateOrderStatus(id, status));
    }

    @PostMapping("/{id}/confirm")
    public ApiResponse<OrderResponse> confirmOrder(@PathVariable Long id) {
        return ApiResponse.success("Order confirmed by shop", orderService.updateOrderStatus(id, OrderStatus.WAITING_PICKUP));
    }

    @PostMapping("/{id}/ship")
    public ApiResponse<OrderResponse> shipOrder(@PathVariable Long id) {
        return ApiResponse.success("Order handed to shipping", orderService.updateOrderStatus(id, OrderStatus.SHIPPING));
    }

    @PostMapping("/{id}/receive")
    public ApiResponse<OrderResponse> receiveOrder(@PathVariable Long id) {
        return ApiResponse.success("Order delivered successfully", orderService.updateOrderStatus(id, OrderStatus.DELIVERED));
    }

    @PostMapping("/{id}/return")
    public ApiResponse<OrderResponse> returnOrder(@PathVariable Long id) {
        return ApiResponse.success("Order return requested", orderService.updateOrderStatus(id, OrderStatus.RETURNED));
    }
}
