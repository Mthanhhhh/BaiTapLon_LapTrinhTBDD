package com.team.ecommerce.order.controller;

import com.team.ecommerce.order.dto.OrderResponse;
import com.team.ecommerce.order.entity.OrderStatus;
import com.team.ecommerce.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/orders")
@RequiredArgsConstructor
public class InternalOrderController {

    private final OrderService orderService;

    @GetMapping("/{id}")
    public OrderResponse getOrderById(
            @PathVariable("id") Long id,
            @RequestParam("userId") Long userId) {
        return orderService.getOrderById(userId, id);
    }

    @PutMapping("/{id}/status")
    public void updateOrderStatus(
            @PathVariable("id") Long id,
            @RequestParam("status") OrderStatus status) {
        orderService.updateOrderStatus(id, status);
    }
}

