package com.team.ecommerce.auth.repository;

import com.team.ecommerce.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailAndDeletedAtIsNull(String email);
    boolean existsByEmail(String email);
    Optional<User> findByIdAndDeletedAtIsNull(Long id);
}
