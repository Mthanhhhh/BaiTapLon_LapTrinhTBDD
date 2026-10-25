package com.team.ecommerce.product.entity;

import com.team.ecommerce.shared.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name = "categories", schema = "product_db")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(name = "parent_id")
    private Long parentId;

    @Column(name = "icon_url")
    private String iconUrl;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "theme_color")
    private String themeColor;

    @Column(nullable = false)
    @Builder.Default
    private int level = 1;

    @Column(nullable = false)
    @Builder.Default
    private String path = "/";

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int displayOrder = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean active = true;
}