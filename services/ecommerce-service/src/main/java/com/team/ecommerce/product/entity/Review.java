package com.team.ecommerce.product.entity;

import com.team.ecommerce.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "reviews", schema = "product_db")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review extends BaseEntity {

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "sku_id")
    private Long skuId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "order_item_id", nullable = false)
    private Long orderItemId;

    @Column(name = "reviewer_name", nullable = false)
    private String reviewerName;

    @Column(name = "reviewer_avatar_url")
    private String reviewerAvatarUrl;

    @Column(nullable = false)
    private int rating;                       // 1..5

    @Column(name = "content", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "sentiment")
    private String emotion;                   // chỉ nhận BAD, NEUTRAL, GOOD

    @Column(name = "is_anonymous", nullable = false)
    @Builder.Default
    private Boolean anonymous = false;

    @Column(nullable = false)
    @Builder.Default
    private String status = "VISIBLE";        // VISIBLE, HIDDEN, PENDING

    @Column(name = "like_count", nullable = false)
    @Builder.Default
    private int likeCount = 0;

    @Column(name = "seller_reply", columnDefinition = "TEXT")
    private String sellerReply;

    @Column(name = "seller_replied_at")
    private LocalDateTime sellerRepliedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    @OrderBy("sortOrder ASC")
    @Builder.Default
    private List<ReviewImage> images = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "review_tags", schema = "product_db",
            joinColumns = @JoinColumn(name = "review_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id"))
    @Builder.Default
    private Set<FeedbackTag> tags = new HashSet<>();
}