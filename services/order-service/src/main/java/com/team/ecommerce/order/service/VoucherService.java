package com.team.ecommerce.order.service;

import com.team.ecommerce.order.dto.VoucherResponse;
import com.team.ecommerce.order.entity.Voucher;
import com.team.ecommerce.order.repository.VoucherRepository;
import com.team.ecommerce.shared.exception.BadRequestException;
import com.team.ecommerce.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class VoucherService {

    private final VoucherRepository voucherRepository;

    public VoucherResponse validateVoucher(String code, BigDecimal subtotal) {
        Voucher voucher = voucherRepository.findByCodeAndIsActiveTrue(code)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", "code", code));

        if (!voucher.isValid()) {
            throw new BadRequestException("Voucher is invalid or expired");
        }

        if (subtotal.compareTo(voucher.getMinOrderAmount()) < 0) {
            throw new BadRequestException("Order amount does not meet minimum requirement for voucher");
        }

        return VoucherResponse.from(voucher, subtotal);
    }

    public void incrementUsedCount(Long voucherId) {
        Voucher voucher = voucherRepository.findById(voucherId)
                .orElseThrow(() -> new ResourceNotFoundException("Voucher", "id", voucherId));
        voucher.setUsedCount(voucher.getUsedCount() + 1);
        voucherRepository.save(voucher);
    }
}
