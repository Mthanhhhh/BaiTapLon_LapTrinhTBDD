package com.team.ecommerce.auth.entity;

import com.team.ecommerce.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="user_addresses", catalog = "auth_db")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "recipient_name", nullable = false)
    private String fullName;
    @Column(nullable = false, length = 20)
    private String phone;
    @Column(name = "address_line", nullable = false)
    private String street;
    @Column(name = "province", nullable = false)
    private String city;
    @Column(name = "district", nullable = false)
    private String state;
    @Column(name = "country_code", nullable = false, length = 2)
    private String country;

    @Column(name = "postal_code")
    private String zipCode;

    @Column(name = "is_default")
    @Builder.Default
    private boolean isDefault = false;
}
