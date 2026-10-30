package com.team.ecommerce.order.repository;

import com.team.ecommerce.order.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByCartIdAndProductIdAndVariantId(Long cartId, Long productId, Long variantId);
    List<CartItem> findByCartId(Long cartId);
    void deleteByCartId(Long cartId);

    @Modifying
    @Query("delete from CartItem item where item.cart.id = :cartId")
    int deleteAllByCartIdInBulk(@Param("cartId") Long cartId);
}
