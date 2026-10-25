package com.team.ecommerce.order.repository;

import com.team.ecommerce.order.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    Optional<Voucher> findByCodeAndIsActiveTrue(String code);
}
