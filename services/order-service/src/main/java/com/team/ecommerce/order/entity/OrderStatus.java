package com.team.ecommerce.order.entity;

public enum OrderStatus {
    PENDING_PAYMENT,
    WAITING_CONFIRMATION,
    WAITING_PICKUP,
    SHIPPING,
    DELIVERED,
    RETURNED,
    CANCELLED,
    PAID
}
