package com.team.ecommerce.order.dto;

import com.team.ecommerce.order.entity.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private Long userId;
    private OrderStatus status;
    private List<OrderItemResponse> items;
    private BigDecimal subtotal;
    private BigDecimal discount;
    private BigDecimal tax;
    private BigDecimal fees;
    private BigDecimal total;
    private String voucherCode;
    private String shippingName;
    private String shippingPhone;
    private String shippingStreet;
    private String shippingCity;
    private String shippingCountry;
    private String note;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
