package com.team.ecommerce.payment.dto;

import com.team.ecommerce.payment.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {
    @NotNull(message = "Order ID is required")
    private Long orderId;

    @NotNull(message = "Payment method is required")
    private PaymentMethod method;

    private String cardNumber;
    private String cardHolderName;
    private String cardExpiry;
    private String cardCvv;
    private String paypalEmail;
}
