package com.team.ecommerce.product.entity;
import jakarta.persistence.*;
import lombok.Getter;
@Entity @Table(name="shops") @Getter
public class Shop {
 @Id private Long id;
 private String name;
 private String province;
}
