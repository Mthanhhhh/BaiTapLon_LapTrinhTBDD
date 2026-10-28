package com.team.ecommerce.shared.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentFailedEvent implements Serializable {
    private Long orderId;
    private Long paymentId;
    private BigDecimal amount;
    private String reason;
    private List<OrderCreatedEvent.OrderItemEvent> items;
}

