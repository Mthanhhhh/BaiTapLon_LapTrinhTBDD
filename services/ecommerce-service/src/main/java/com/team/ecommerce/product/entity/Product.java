package com.team.ecommerce.product.entity;

import com.team.ecommerce.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products", schema = "product_db")
@SQLRestriction("deleted_at IS NULL")   // xoá mềm: tự bỏ qua sản phẩm đã xoá
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product extends BaseEntity {

    @Column(name = "shop_id", nullable = false)
    private Long shopId;

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @Column(name = "brand_id")
    private Long brandId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String slug;

    @Column(name = "short_description")
    private String shortDescription;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(nullable = false)
    @Builder.Default
    private String currency = "USD";

    @Column(name = "min_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal minPrice;

    @Column(name = "max_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal maxPrice;

    @Column(name = "original_price", precision = 12, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "discount_percent", nullable = false)
    @Builder.Default
    private int discountPercent = 0;

    @Column(name = "promo_label")
    private String promoLabel;

    // Cột JSON: giữ kiểu String như cũ, KHÔNG thêm @JdbcTypeCode
    @Column(columnDefinition = "json")
    private String attributes;

    @Column(name = "has_free_return_30d", nullable = false)
    @Builder.Default
    private Boolean hasFreeReturn30d = false;

    @Column(name = "weight_grams")
    private Integer weightGrams;

    @Column(name = "has_buyer_protection", nullable = false)
    @Builder.Default
    private Boolean hasBuyerProtection = false;

    @Column(name = "is_best_deal", nullable = false)
    @Builder.Default
    private Boolean bestDeal = false;

    @Column(name = "supports_ship_to_store", nullable = false)
    @Builder.Default
    private Boolean supportsShipToStore = false;

    @Column(name = "rating_avg", nullable = false, precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal ratingAvg = BigDecimal.ZERO;

    @Column(name = "rating_count", nullable = false)
    @Builder.Default
    private int ratingCount = 0;

    @Column(name = "sold_count", nullable = false)
    @Builder.Default
    private int soldCount = 0;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private int viewCount = 0;

    @Column(name = "favorite_count", nullable = false)
    @Builder.Default
    private int favoriteCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ProductStatus status = ProductStatus.ACTIVE;

    @Version
    private Long version;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // Ảnh nằm ở bảng product_images. Chỉ đọc, ghi ảnh dùng ProductImageRepository
    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", insertable = false, updatable = false)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<ProductImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductVariant> variants = new ArrayList<>();

    // ---- Tương thích code cũ ----
    public BigDecimal getPrice() {
        return minPrice;
    }

    public boolean isActive() {
        return status == ProductStatus.ACTIVE;
    }
}