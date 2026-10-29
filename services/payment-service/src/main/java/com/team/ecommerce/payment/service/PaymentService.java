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
        OrderResponse order = orderService.getOrderById(userId, request.getOrderId());

        if (order.getStatus() != OrderStatus.PENDING_PAYMENT) {
            throw new BadRequestException("Order is not pending payment");
        }

        Optional<Payment> existingPayment = paymentRepository.findByOrderId(order.getId());
        if (existingPayment.isPresent() && existingPayment.get().getStatus() == PaymentStatus.COMPLETED) {
            throw new BadRequestException("Order is already paid");
        }

        Payment payment = existingPayment.orElseGet(() -> Payment.builder()
                .orderId(order.getId())
                .method(request.getMethod())
                .status(PaymentStatus.PENDING)
                .amount(order.getTotal())
                .build());

        payment.setUserId(userId);
        payment.setPaymentNo("PAY-"+order.getId());
        payment.setOrderNo("ORD-"+order.getId());
        payment.setIdempotencyKey("order-"+order.getId());
        payment.setMethod(request.getMethod());
        payment.setMethodType(request.getMethod() == PaymentMethod.PAYPAL ? "PAYPAL" : "CARD");
        payment.setTransactionId(UUID.randomUUID().toString());

        if (request.getMethod() == PaymentMethod.VISA || request.getMethod() == PaymentMethod.MAESTRO) {
            if (request.getCardNumber() == null || request.getCardNumber().length() < 4) {
                throw new BadRequestException("Invalid card number");
            }
            if (request.getCardNumber().endsWith("0000")) {
                payment.setStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);

                // Saga Pattern: Publish PaymentFailedEvent to trigger stock compensation via Kafka
                var items = order.getItems() != null ? order.getItems().stream()
                        .map(item -> OrderCreatedEvent.OrderItemEvent.builder()
                                .productId(item.getProductId())
                                .variantId(item.getVariantId())
                                .quantity(item.getQuantity())
                                .build())
                        .toList() : null;

                eventPublisher.publishPaymentFailed(PaymentFailedEvent.builder()
                        .orderId(order.getId())
                        .paymentId(payment.getId())
                        .amount(order.getTotal())
                        .reason("Card ending in 0000 simulates decline")
                        .items(items)
                        .build());

                throw new BadRequestException("Payment failed (mocked)");
            }
            payment.setCardLastFour(request.getCardNumber().substring(request.getCardNumber().length() - 4));
            payment.setCardType(request.getMethod().name());
        }

        payment.setStatus(PaymentStatus.COMPLETED);
        payment.setPaidAt(LocalDateTime.now());
        paymentRepository.save(payment);

        orderService.updateOrderStatus(order.getId(), OrderStatus.WAITING_CONFIRMATION);

        return PaymentResponse.from(payment);
    }

    public PaymentResponse getPaymentByOrderId(Long userId, Long orderId) {
        orderService.getOrderById(userId, orderId);
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment", "orderId", orderId));
        return PaymentResponse.from(payment);
    }
}
