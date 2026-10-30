package com.team.ecommerce.shared.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ApplicationEventPublisher applicationEventPublisher;

    public void publishOrderCreated(OrderCreatedEvent event) {
        log.info("Publishing OrderCreatedEvent to Kafka: orderId={}", event.getOrderId());
        // Dispatch only after the order and its cart changes have committed.
        // Kafka may be unavailable in local development and must not hold the HTTP request open.
        applicationEventPublisher.publishEvent(event);
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void sendOrderCreatedEvent(OrderCreatedEvent event) {
        try {
            kafkaTemplate.send("order-events", String.valueOf(event.getOrderId()), event);
        } catch (Exception e) {
            log.error("Failed to send OrderCreatedEvent to Kafka", e);
        }
    }

    public void publishPaymentFailed(PaymentFailedEvent event) {
        log.info("Publishing PaymentFailedEvent (Saga Compensation) to Kafka: orderId={}", event.getOrderId());
        try {
            kafkaTemplate.send("payment-events", String.valueOf(event.getOrderId()), event);
        } catch (Exception e) {
            log.error("Failed to send PaymentFailedEvent to Kafka", e);
        }
    }
}

