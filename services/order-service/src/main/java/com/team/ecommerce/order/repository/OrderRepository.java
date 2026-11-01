package com.team.ecommerce.order.repository;

import com.team.ecommerce.order.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    @org.springframework.data.jpa.repository.Query(value="SELECT o.* FROM orders o WHERE o.currency='VND' AND EXISTS (SELECT 1 FROM order_items i JOIN product_db.products p ON p.id=i.product_id JOIN product_db.shops s ON s.id=p.shop_id WHERE i.order_id=o.id AND s.owner_user_id=:userId AND s.status='ACTIVE' AND s.deleted_at IS NULL) AND NOT EXISTS (SELECT 1 FROM order_items i JOIN product_db.products p ON p.id=i.product_id JOIN product_db.shops s ON s.id=p.shop_id WHERE i.order_id=o.id AND s.owner_user_id<>:userId) ORDER BY o.created_at DESC,o.id DESC",countQuery="SELECT COUNT(*) FROM orders o WHERE o.currency='VND' AND EXISTS (SELECT 1 FROM order_items i JOIN product_db.products p ON p.id=i.product_id JOIN product_db.shops s ON s.id=p.shop_id WHERE i.order_id=o.id AND s.owner_user_id=:userId AND s.status='ACTIVE' AND s.deleted_at IS NULL) AND NOT EXISTS (SELECT 1 FROM order_items i JOIN product_db.products p ON p.id=i.product_id JOIN product_db.shops s ON s.id=p.shop_id WHERE i.order_id=o.id AND s.owner_user_id<>:userId)",nativeQuery=true)
    Page<Order> findShopOrders(@org.springframework.data.repository.query.Param("userId") Long userId,Pageable pageable);
    @org.springframework.data.jpa.repository.Query("SELECT o FROM Order o WHERE o.userId=:userId AND o.currency='VND' ORDER BY o.createdAt DESC")
    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Optional<Order> findByIdempotencyKey(String key);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT o FROM Order o WHERE o.id=:id")
    Optional<Order> findForUpdate(@org.springframework.data.repository.query.Param("id") Long id);
    Optional<Order> findByIdAndUserId(Long id, Long userId);
}
