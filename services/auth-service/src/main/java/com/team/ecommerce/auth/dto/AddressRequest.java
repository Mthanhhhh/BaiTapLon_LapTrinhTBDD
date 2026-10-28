package com.team.ecommerce.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddressRequest {
    @NotBlank
    private String fullName;
    @NotBlank
    private String phone;
    @NotBlank
    private String street;
    @NotBlank
    private String city;
    private String state;
    @NotBlank
    private String country;
    private String zipCode;
    private boolean isDefault;
}
