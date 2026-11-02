package com.team.ecommerce.payment.service;

import com.team.ecommerce.order.dto.OrderResponse;
import com.team.ecommerce.order.entity.OrderStatus;
import com.team.ecommerce.order.service.OrderService;
import com.team.ecommerce.payment.dto.PaymentRequest;
import com.team.ecommerce.payment.dto.PaymentResponse;
import com.team.ecommerce.payment.entity.Payment;
import com.team.ecommerce.payment.entity.PaymentMethod;
import com.team.ecommerce.payment.entity.PaymentStatus;
import com.team.ecommerce.payment.repository.PaymentRepository;
import com.team.ecommerce.shared.event.EventPublisher;
import com.team.ecommerce.shared.event.OrderCreatedEvent;
import com.team.ecommerce.shared.event.PaymentFailedEvent;
import com.team.ecommerce.shared.exception.BadRequestException;
import com.team.ecommerce.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional("paymentTransactionManager")
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderService orderService;
    private final EventPublisher eventPublisher;

    public PaymentResponse processPayment(Long userId, PaymentRequest request) {
        orderService.getOrderById(userId, request.getOrderId());
        throw new BadRequestException("Chưa kết nối cổng thanh toán. Không có khoản tiền nào bị trừ. Vui lòng dùng COD hoặc chờ cấu hình merchant.");
    }

    public PaymentResponse getPaymentByOrderId(Long userId, Long orderId) {
        orderService.getOrderById(userId, orderId);
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "orderId", orderId));
        return PaymentResponse.from(payment);
    }
}
