package com.team.ecommerce.order.entity;

import com.team.ecommerce.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher extends BaseEntity {

    @Column(unique = true, nullable = false)
    private String code;

    @Convert(converter = VoucherTypeConverter.class)
    @Column(name = "discount_type", nullable = false)
    private VoucherType type;

    @Column(name = "discount_value", nullable = false, precision = 12, scale = 2)
    private BigDecimal value;

    @Column(name = "min_order_amount", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal minOrderAmount = BigDecimal.ZERO;

    @Column(name = "max_discount_amount", precision = 12, scale = 2)
    private BigDecimal maxDiscount;

    @Column(name = "total_quantity")
    private Integer usageLimit;

    @Column(name = "used_quantity")
    @Builder.Default
    private int usedCount = 0;

    @Column(name = "starts_at", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "ends_at", nullable = false)
    private LocalDateTime endDate;

    @Convert(converter = VoucherActiveStatusConverter.class)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    public boolean isValid() {
        LocalDateTime now = LocalDateTime.now();
        return isActive && 
               !now.isBefore(startDate) && 
               !now.isAfter(endDate) && 
               (usageLimit == null || usedCount < usageLimit);
    }
}
