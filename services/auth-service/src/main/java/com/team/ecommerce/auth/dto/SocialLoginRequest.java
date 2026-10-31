package com.team.ecommerce.auth.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
@Data
public class SocialLoginRequest {
    @NotBlank private String provider;
    @NotBlank @Size(max=4096) private String code;
    @NotBlank @Size(max=512) private String redirectUri;
    @Size(max=128) private String codeVerifier;
}
