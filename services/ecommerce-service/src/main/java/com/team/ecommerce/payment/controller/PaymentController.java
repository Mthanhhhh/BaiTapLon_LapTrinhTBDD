package com.team.ecommerce.payment.controller;

import com.team.ecommerce.payment.dto.PaymentRequest;
import com.team.ecommerce.payment.dto.PaymentResponse;
import com.team.ecommerce.payment.service.PaymentService;
import com.team.ecommerce.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final Long MOCK_USER_ID = 1L; // To be replaced with actual auth principal

    @PostMapping
    public ApiResponse<PaymentResponse> processPayment(@Valid @RequestBody PaymentRequest request) {
        return ApiResponse.success("Payment processed successfully", paymentService.processPayment(MOCK_USER_ID, request));
    }

    @GetMapping("/order/{orderId}")
    public ApiResponse<PaymentResponse> getPaymentByOrderId(@PathVariable Long orderId) {
        return ApiResponse.success(paymentService.getPaymentByOrderId(orderId));
    }
}
