package com.team.ecommerce.product.repository;

import com.team.ecommerce.product.entity.FeedbackTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeedbackTagRepository extends JpaRepository<FeedbackTag, Integer> {
    List<FeedbackTag> findByCodeIn(List<String> codes);
}

