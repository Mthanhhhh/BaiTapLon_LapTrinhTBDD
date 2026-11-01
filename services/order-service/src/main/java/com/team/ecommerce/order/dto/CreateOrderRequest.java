package com.team.ecommerce.order.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {
    @NotNull(message = "Address ID is required")
    private Long addressId;

    @com.fasterxml.jackson.annotation.JsonIgnore private java.util.List<Long> excluded;
    @com.fasterxml.jackson.annotation.JsonIgnore private boolean batchInternal;
    private java.util.List<Long> cartItemIds;
    private Long skuId;
    private Integer quantity;
    private String voucherCode;
    private java.util.List<String> voucherCodes;
    private Boolean autoBest;
    @jakarta.validation.constraints.NotBlank
    private String quoteHash;
    @jakarta.validation.constraints.NotBlank
    @jakarta.validation.constraints.Pattern(regexp="[A-Za-z0-9_-]{16,48}")
    private String idempotencyKey;

    private String note;

    @NotNull(message = "Payment method is required")
    private String paymentMethod;
}
