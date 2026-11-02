package com.team.ecommerce.shared.integration;

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
