package com.team.ecommerce.payment.entity;
import jakarta.persistence.*;
@Converter
public class PaymentStatusConverter implements AttributeConverter<PaymentStatus,String> {
 public String convertToDatabaseColumn(PaymentStatus s){return s==null?null:s==PaymentStatus.COMPLETED?"SUCCESS":s.name();}
 public PaymentStatus convertToEntityAttribute(String s){return s==null?null:s.equals("SUCCESS")?PaymentStatus.COMPLETED:PaymentStatus.valueOf(s);}
}
