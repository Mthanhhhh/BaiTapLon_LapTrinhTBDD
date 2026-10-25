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

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success("Registration successful", authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success("Login successful", authService.login(request));
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
