package com.team.ecommerce.order.dto;

import com.team.ecommerce.order.entity.OrderItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {
    private Long id;
    private Long productId;
    private Long variantId;
    private String productName;
    private String productImage;
    private String variantName;
    private BigDecimal price;
    private int quantity;
    private BigDecimal subtotal;

    public static OrderItemResponse from(OrderItem item) {
        return OrderItemResponse.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .variantId(item.getVariantId())
                .productName(item.getProductName())
                .productImage(item.getProductImage())
                .variantName(item.getVariantName())
                .price(item.getPrice())
                .quantity(item.getQuantity())
                .subtotal(item.getSubtotal())
                .build();
    }
}
