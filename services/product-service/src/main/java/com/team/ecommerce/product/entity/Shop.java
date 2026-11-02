package com.team.ecommerce.product.entity;
import jakarta.persistence.*;
import lombok.Getter;
@org.hibernate.annotations.BatchSize(size = 32)
@Entity @Table(name="shops") @Getter
public class Shop {
 @Id private Long id;
 private String name;
 private String province;
 private String status;
 private java.time.LocalDateTime deletedAt;
}
