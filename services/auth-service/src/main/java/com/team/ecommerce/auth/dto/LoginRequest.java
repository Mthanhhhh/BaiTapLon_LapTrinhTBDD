package com.team.ecommerce.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "Email hoặc số điện thoại không được để trống")
    @jakarta.validation.constraints.Size(max=254)
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @jakarta.validation.constraints.Size(max=256)
    private String password;

    private Boolean rememberMe = false;
}
