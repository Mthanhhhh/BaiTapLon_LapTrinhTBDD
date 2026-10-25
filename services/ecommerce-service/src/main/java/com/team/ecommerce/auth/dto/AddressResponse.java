package com.team.ecommerce.auth.dto;

import com.team.ecommerce.auth.entity.Address;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AddressResponse {
    private Long id;
    private String fullName;
    private String phone;
    private String street;
    private String city;
    private String state;
    private String country;
    private String zipCode;
    private boolean isDefault;

    public static AddressResponse from(Address address) {
        return AddressResponse.builder()
                .id(address.getId())
                .fullName(address.getFullName())
                .phone(address.getPhone())
                .street(address.getStreet())
                .city(address.getCity())
                .state(address.getState())
                .country(address.getCountry())
                .zipCode(address.getZipCode())
                .isDefault(address.isDefault())
                .build();
    }
}
