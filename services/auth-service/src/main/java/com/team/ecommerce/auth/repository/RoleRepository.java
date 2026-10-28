package com.team.ecommerce.auth.repository;

import com.team.ecommerce.auth.entity.Role;
import com.team.ecommerce.auth.entity.RoleEnum;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByCode(RoleEnum code);
}

