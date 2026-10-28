package com.team.ecommerce.auth.entity;

import com.team.ecommerce.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="addresses", catalog = "auth_db")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "full_name")
    private String fullName;
    private String phone;
    private String street;
    private String city;
    private String state;
    private String country;

    @Column(name = "zip_code")
    private String zipCode;

    @Column(name = "is_default")
    @Builder.Default
    private boolean isDefault = false;
}
