package com.team.ecommerce.product.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "feedback_tags", schema = "product_db")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedbackTag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String code;      // SERVICE, QUANTITY, PAYMENT, DELIVERY, PROMOTION, GIFT

    @Column(nullable = false)
    private String name;
}