package com.team.ecommerce.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @NotBlank(message = "Vui lòng nhập Email hoặc Số điện thoại")
    @jakarta.validation.constraints.Size(max=254)
    private String identifier;
}

