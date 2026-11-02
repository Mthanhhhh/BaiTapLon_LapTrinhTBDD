package com.team.ecommerce.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank(message = "Vui lòng nhập Email hoặc Số điện thoại")
    @jakarta.validation.constraints.Size(max=254)
    private String identifier;

    @NotBlank(message = "Mã OTP không được để trống")
    @jakarta.validation.constraints.Pattern(regexp="[0-9]{6}")
    private String otp;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 8, max = 72, message = "Mật khẩu phải có từ 8 đến 72 ký tự")
    @com.team.ecommerce.auth.security.NewPassword
    private String newPassword;
}

