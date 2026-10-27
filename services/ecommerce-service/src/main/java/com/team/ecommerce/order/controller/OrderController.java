package com.team.ecommerce.order.controller;

import com.team.ecommerce.auth.service.AuthService;
import com.team.ecommerce.order.dto.CreateOrderRequest;
import com.team.ecommerce.order.dto.OrderResponse;
import com.team.ecommerce.order.service.OrderService;
import com.team.ecommerce.shared.dto.ApiResponse;
import com.team.ecommerce.shared.dto.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final AuthService authService;

    @PostMapping
    public ApiResponse<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        return ApiResponse.success("Order created successfully", orderService.createOrder(authService.getCurrentUserId(), request));
    }

    @GetMapping
    public ApiResponse<PageResponse<OrderResponse>> getOrders(Pageable pageable) {
        return ApiResponse.success(orderService.getOrders(authService.getCurrentUserId(), pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderResponse> getOrderById(@PathVariable Long id) {
        return ApiResponse.success(orderService.getOrderById(authService.getCurrentUserId(), id));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<OrderResponse> cancelOrder(@PathVariable Long id) {
        return ApiResponse.success("Order cancelled", orderService.cancelOrder(authService.getCurrentUserId(), id));
    }
}
