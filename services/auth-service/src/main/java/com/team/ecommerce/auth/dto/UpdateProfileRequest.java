package com.team.ecommerce.auth.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    @jakarta.validation.constraints.Size(min=1,max=150)
    private String fullName;
    @jakarta.validation.constraints.Pattern(regexp="(?:|(?:0|\\+84)[0-9]{9,10})")
    private String phone;
    @jakarta.validation.constraints.Size(max=1000)
    @jakarta.validation.constraints.Pattern(regexp="(?:|https://[^\\s]+)")
    private String avatarUrl;
}
