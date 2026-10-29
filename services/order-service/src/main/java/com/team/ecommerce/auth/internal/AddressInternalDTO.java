package com.team.ecommerce.auth.internal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddressInternalDTO {
    private Long id;
    private String fullName;
    private String phone;
    private String street;
    private String city;
    private String district;
    private String country;
}
