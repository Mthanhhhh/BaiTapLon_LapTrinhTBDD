package com.team.ecommerce.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RefreshTokenRequest {
    @NotBlank
    @jakarta.validation.constraints.Size(max=4096)
    private String refreshToken;
}
