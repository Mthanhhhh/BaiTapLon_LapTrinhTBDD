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

    @jakarta.validation.constraints.Size(max=512)
    private String paymentToken;

    @com.fasterxml.jackson.annotation.JsonAnySetter
    public void rejectUnrecognizedInstrument(String field,Object value) {
        throw new com.team.ecommerce.shared.exception.BadRequestException("Không gửi số thẻ hoặc CVV tới E-Shop. Chỉ sử dụng cổng thanh toán đã cấu hình.");
    }
}
