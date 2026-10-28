package com.team.ecommerce.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SocialLoginRequest {
    @NotBlank(message = "Nhà cung cấp không được để trống (google/facebook)")
    private String provider;

    @NotBlank(message = "Email không được để trống")
    private String email;

    private String fullName;
    private String avatarUrl;
    private String providerId;
    private String token;
}

