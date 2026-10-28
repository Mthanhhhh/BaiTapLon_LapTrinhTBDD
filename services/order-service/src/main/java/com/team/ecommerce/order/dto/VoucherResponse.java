package com.team.ecommerce.order.dto;

import com.team.ecommerce.order.entity.Voucher;
import com.team.ecommerce.order.entity.VoucherType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherResponse {
    private Long id;
    private String code;
    private VoucherType type;
    private BigDecimal value;
    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscount;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private BigDecimal discountAmount;

    public static VoucherResponse from(Voucher voucher) {
        return VoucherResponse.builder()
                .id(voucher.getId())
                .code(voucher.getCode())
                .type(voucher.getType())
                .value(voucher.getValue())
                .minOrderAmount(voucher.getMinOrderAmount())
                .maxDiscount(voucher.getMaxDiscount())
                .startDate(voucher.getStartDate())
                .endDate(voucher.getEndDate())
                .build();
    }

    public static VoucherResponse from(Voucher voucher, BigDecimal subtotal) {
        VoucherResponse response = from(voucher);
        BigDecimal discount = BigDecimal.ZERO;
        
        if (voucher.getType() == VoucherType.PERCENTAGE) {
            discount = subtotal.multiply(voucher.getValue()).divide(BigDecimal.valueOf(100));
            if (voucher.getMaxDiscount() != null && discount.compareTo(voucher.getMaxDiscount()) > 0) {
                discount = voucher.getMaxDiscount();
            }
        } else if (voucher.getType() == VoucherType.FIXED) {
            discount = voucher.getValue();
        }
        
        response.setDiscountAmount(discount);
        return response;
    }
}
