package com.team.ecommerce.auth.controller;

import com.team.ecommerce.auth.dto.*;
import com.team.ecommerce.auth.service.AuthService;
import com.team.ecommerce.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final com.team.ecommerce.auth.service.SocialOAuthService socialOAuth;

    @GetMapping("/oauth/config")
    public ApiResponse<java.util.Map<String,Object>> oauthConfig() { return ApiResponse.success(socialOAuth.configuration()); }

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success("Registration successful", authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success("Login successful", authService.login(request));
    }

    @PostMapping("/social-login")
    public ApiResponse<AuthResponse> socialLogin(@Valid @RequestBody SocialLoginRequest request) {
        return ApiResponse.success("Social login successful", authService.socialLogin(request));
    }

    @PostMapping("/forgot-password")
    public ApiResponse<java.util.Map<String, Object>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ApiResponse.success("OTP sent", authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    public ApiResponse<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.success("Đặt lại mật khẩu thành công", "Password reset successfully");
    }

    @PostMapping("/qr/generate")
    public ApiResponse<QrLoginResponse> generateQrSession() {
        return ApiResponse.success("QR session created", authService.generateQrSession());
    }

    @GetMapping("/qr/check")
    public ApiResponse<QrLoginResponse> checkQrSession(@RequestParam String qrToken) {
        return ApiResponse.success("QR status checked", authService.checkQrSession(qrToken));
    }

    @PostMapping("/qr/confirm")
    public ApiResponse<String> confirmQrLogin(@RequestParam String qrToken, @RequestParam(required = false) Long userId) {
        authService.confirmQrLogin(qrToken, userId);
        return ApiResponse.success("QR login confirmed", "Confirmed successfully");
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.success("Token refreshed", authService.refreshToken(request.getRefreshToken()));
    }

    @GetMapping("/me")
    public ApiResponse<UserProfileResponse> getProfile() {
        Long userId = authService.getCurrentUserId();
        return ApiResponse.success("Profile fetched", authService.getProfile(userId));
    }

    @PutMapping("/me")
    public ApiResponse<UserProfileResponse> updateProfile(@RequestBody UpdateProfileRequest request) {
        Long userId = authService.getCurrentUserId();
        return ApiResponse.success("Profile updated", authService.updateProfile(userId, request));
    }
}
