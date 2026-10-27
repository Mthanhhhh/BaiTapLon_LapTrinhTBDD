package com.team.ecommerce.payment.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class PaymentStatusConverter implements AttributeConverter<PaymentStatus, String> {
    @Override
    public String convertToDatabaseColumn(PaymentStatus status) {
        if (status == null) return null;
        return status == PaymentStatus.COMPLETED ? "SUCCESS" : status.name();
    }

    @Override
    public PaymentStatus convertToEntityAttribute(String status) {
        if (status == null) return null;
        return "SUCCESS".equalsIgnoreCase(status) ? PaymentStatus.COMPLETED : PaymentStatus.valueOf(status);
    }
}
