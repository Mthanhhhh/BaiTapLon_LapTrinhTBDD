package com.team.ecommerce.order.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class VoucherActiveStatusConverter implements AttributeConverter<Boolean, String> {
    @Override
    public String convertToDatabaseColumn(Boolean active) {
        return Boolean.TRUE.equals(active) ? "ACTIVE" : "PAUSED";
    }

    @Override
    public Boolean convertToEntityAttribute(String status) {
        return "ACTIVE".equalsIgnoreCase(status);
    }
}
