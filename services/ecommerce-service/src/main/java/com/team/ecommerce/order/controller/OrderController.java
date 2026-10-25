package com.team.ecommerce.order.controller;

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
    private final Long MOCK_USER_ID = 1L; // To be replaced with actual auth principal

    @PostMapping
    public ApiResponse<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        return ApiResponse.success("Order created successfully", orderService.createOrder(MOCK_USER_ID, request));
    }

    @GetMapping
    public ApiResponse<PageResponse<OrderResponse>> getOrders(Pageable pageable) {
        return ApiResponse.success(orderService.getOrders(MOCK_USER_ID, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderResponse> getOrderById(@PathVariable Long id) {
        return ApiResponse.success(orderService.getOrderById(MOCK_USER_ID, id));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<OrderResponse> cancelOrder(@PathVariable Long id) {
        return ApiResponse.success("Order cancelled", orderService.cancelOrder(MOCK_USER_ID, id));
    }
}
