package com.team.ecommerce.payment.controller;

import com.team.ecommerce.payment.dto.PaymentRequest;
import com.team.ecommerce.payment.dto.PaymentResponse;
import com.team.ecommerce.payment.service.PaymentService;
import com.team.ecommerce.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public ApiResponse<PaymentResponse> processPayment(@AuthenticationPrincipal Long userId, @Valid @RequestBody PaymentRequest request) {
        return ApiResponse.success("Payment processed successfully", paymentService.processPayment(userId, request));
    }

    @GetMapping("/order/{orderId}")
    public ApiResponse<PaymentResponse> getPaymentByOrderId(@AuthenticationPrincipal Long userId, @PathVariable Long orderId) {
        return ApiResponse.success(paymentService.getPaymentByOrderId(userId, orderId));
    }
}
