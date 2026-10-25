package com.team.ecommerce.auth.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roles", catalog = "auth_db")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private RoleEnum code;

    @Column(nullable = false)
    private String name;
}
