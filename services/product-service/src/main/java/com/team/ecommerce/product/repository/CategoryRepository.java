package com.team.ecommerce.product.repository;

import com.team.ecommerce.product.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByParentIdIsNullOrderByDisplayOrder();
    List<Category> findByParentIdOrderByDisplayOrder(Long parentId);
    Optional<Category> findBySlug(String slug);
    boolean existsBySlug(String slug);
    List<Category> findByPathStartingWith(String path);
}
