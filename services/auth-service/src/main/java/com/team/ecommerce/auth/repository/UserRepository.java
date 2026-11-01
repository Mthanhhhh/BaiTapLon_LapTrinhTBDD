package com.team.ecommerce.auth.repository;

import com.team.ecommerce.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailAndDeletedAtIsNull(String email);
    Optional<User> findByPhoneAndDeletedAtIsNull(String phone);
    
    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE (u.email = :identifier OR u.phone = :identifier) AND u.deletedAt IS NULL")
    Optional<User> findByIdentifier(@org.springframework.data.repository.query.Param("identifier") String identifier);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> lockAddressOwner(@org.springframework.data.repository.query.Param("id") Long id);

    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    Optional<User> findByIdAndDeletedAtIsNull(Long id);
}
