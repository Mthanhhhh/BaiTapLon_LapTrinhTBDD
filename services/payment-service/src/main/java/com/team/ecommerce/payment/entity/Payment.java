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

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Enumerated(EnumType.STRING)
    @Column(name="method_brand")
    private PaymentMethod method;

    @Column(name="payment_no") private String paymentNo;
    @Column(name="order_no") private String orderNo;
    @Column(name="user_id") private Long userId;
    @Column(name="method_type") private String methodType;
    @Column(name="idempotency_key") private String idempotencyKey;

    @Convert(converter=PaymentStatusConverter.class)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "method_last4")
    private String cardLastFour;

    @Transient
    private String cardType;

    @Column(name = "provider_txn_id", unique = true)
    private String transactionId;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;
}
