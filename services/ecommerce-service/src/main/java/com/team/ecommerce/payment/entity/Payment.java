package com.team.ecommerce.payment.entity;

import com.team.ecommerce.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment extends BaseEntity {

    @Column(name = "payment_no", nullable = false, unique = true, length = 32)
    private String paymentNo;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Enumerated(EnumType.STRING)
    @Column(name = "method_brand")
    private PaymentMethod method;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "order_no", nullable = false)
    private String orderNo;

    @Column(name = "method_type", nullable = false)
    private String methodType;

    @Column(name = "provider", nullable = false)
    private String provider;

    @Column(name = "idempotency_key", nullable = false, unique = true)
    private String idempotencyKey;

    @Convert(converter = PaymentStatusConverter.class)
    @Builder.Default
    @Column(nullable = false)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "method_last4")
    private String cardLastFour;

    @Column(name = "provider_txn_id", unique = true)
    private String transactionId;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    public String getCardType() {
        return method == null ? null : method.name();
    }
}
