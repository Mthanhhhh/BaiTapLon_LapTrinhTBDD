package com.team.ecommerce.shared.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishOrderCreated(OrderCreatedEvent event) {
        log.info("Publishing OrderCreatedEvent to Kafka: orderId={}", event.getOrderId());
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

