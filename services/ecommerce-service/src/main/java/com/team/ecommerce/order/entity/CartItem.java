package com.team.ecommerce.order.entity;

import com.team.ecommerce.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "cart_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id")
    private Cart cart;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "shop_id", nullable = false)
    private Long shopId;

    @Column(name = "sku_id", nullable = false)
    private Long variantId;

    @Column(name = "added_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal addedPrice;

    @Column(nullable = false)
    @Builder.Default
    private int quantity = 1;
}
