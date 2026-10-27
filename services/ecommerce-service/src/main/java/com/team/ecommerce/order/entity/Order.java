package com.team.ecommerce.order.entity;

import com.team.ecommerce.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order extends BaseEntity {

    @Column(name = "order_no", nullable = false, unique = true, length = 32)
    private String orderNo;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 64)
    private String idempotencyKey;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING_PAYMENT;

    @Column(name = "subtotal_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal tax;

    @Column(name = "service_fee", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal fees = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "payment_status", nullable = false)
    @Builder.Default
    private String paymentStatus = "UNPAID";

    @Column(name = "payment_method_type")
    private String paymentMethodType;

    @Column(name = "voucher_id")
    private Long voucherId;

    @Column(name = "recipient_name", nullable = false)
    private String shippingName;

    @Column(name = "recipient_phone", nullable = false)
    private String shippingPhone;

    @Column(name = "ship_address_line", nullable = false)
    private String shippingStreet;

    @Column(name = "ship_province", nullable = false)
    private String shippingCity;

    @Column(name = "ship_district", nullable = false)
    private String shippingDistrict;

    @Column(name = "ship_country", nullable = false, length = 2)
    private String shippingCountry;

    private String note;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();
}
