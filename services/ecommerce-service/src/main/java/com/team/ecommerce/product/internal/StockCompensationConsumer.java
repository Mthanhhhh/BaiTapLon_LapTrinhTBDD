package com.team.ecommerce.product.internal;

import com.team.ecommerce.shared.event.PaymentFailedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class StockCompensationConsumer {

    private final ProductInternalService productInternalService;

    @KafkaListener(topics = "payment-events", groupId = "ecommerce-stock-group")
    public void handlePaymentFailed(PaymentFailedEvent event) {
        log.warn("SAGA COMPENSATION TRIGGERED: Received PaymentFailedEvent for orderId={}, reason={}",
                event.getOrderId(), event.getReason());

        if (event.getItems() != null && !event.getItems().isEmpty()) {
            for (var item : event.getItems()) {
                log.info("Restoring stock via Kafka Saga: productId={}, variantId={}, qty={}",
                        item.getProductId(), item.getVariantId(), item.getQuantity());
                try {
                    productInternalService.restoreStock(item.getProductId(), item.getVariantId(), item.getQuantity());
                } catch (Exception e) {
                    log.error("Failed to restore stock for item", e);
                }
            }
        }
    }
}
