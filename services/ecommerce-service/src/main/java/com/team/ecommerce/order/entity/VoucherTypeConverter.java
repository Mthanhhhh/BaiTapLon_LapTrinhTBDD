package com.team.ecommerce.order.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class VoucherTypeConverter implements AttributeConverter<VoucherType, String> {
    @Override
    public String convertToDatabaseColumn(VoucherType type) {
        if (type == null) return null;
        return type == VoucherType.PERCENTAGE ? "PERCENT" : "FIXED";
    }

    @Override
    public VoucherType convertToEntityAttribute(String value) {
        if (value == null) return null;
        return "PERCENT".equalsIgnoreCase(value) ? VoucherType.PERCENTAGE : VoucherType.FIXED;
    }
}
