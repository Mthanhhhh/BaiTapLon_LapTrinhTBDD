package com.team.ecommerce.auth.service;

import com.team.ecommerce.auth.dto.*;
import com.team.ecommerce.auth.entity.Role;
import com.team.ecommerce.auth.entity.RoleEnum;
import com.team.ecommerce.auth.entity.User;
import com.team.ecommerce.auth.entity.UserStatus;
import com.team.ecommerce.auth.repository.RoleRepository;
import com.team.ecommerce.auth.repository.UserRepository;
import com.team.ecommerce.auth.security.JwtProvider;
import com.team.ecommerce.shared.exception.BadRequestException;
import com.team.ecommerce.shared.exception.DuplicateResourceException;
import com.team.ecommerce.shared.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(noRollbackFor = org.springframework.security.core.AuthenticationException.class)
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final SocialOAuthService socialOAuth;
    private final com.team.ecommerce.auth.security.LoginGuard loginGuard;
    private final com.team.ecommerce.auth.security.SecuritySessions sessions;
    private final com.team.ecommerce.auth.security.SecureChallenges challenges;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("User", "email", request.getEmail());
        }

        Role buyerRole = roleRepository.findByCode(RoleEnum.BUYER)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "code", "BUYER"));

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .roles(Collections.singletonList(buyerRole))
                .status(UserStatus.ACTIVE)
                .build();

        user = userRepository.save(user);

        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        String identifier = request.getEmail().trim();
        var found = userRepository.findByIdentifier(identifier);
        if (found.isEmpty()) loginGuard.missingAccount(request.getPassword());
        User user = found.orElseThrow();
        loginGuard.verify(user.getId(), request.getPassword());
        return buildAuthResponse(user);
    }

    public AuthResponse socialLogin(SocialLoginRequest request) {
        var identity = socialOAuth.exchange(request);
        String email = identity.email();
        String fullName = identity.name();
        String avatarUrl = identity.picture();

        User user = userRepository.findByEmailAndDeletedAtIsNull(email).orElse(null);

        if (user == null) {
            Role buyerRole = roleRepository.findByCode(RoleEnum.BUYER)
                    .orElseThrow(() -> new ResourceNotFoundException("Role", "code", "BUYER"));

            String defaultName = fullName != null && !fullName.isBlank() 
                    ? fullName 
                    : (email.contains("@") ? email.substring(0, email.indexOf("@")) : "Social User");

            user = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                    .fullName(defaultName)
                    .avatarUrl(avatarUrl)
                    .roles(Collections.singletonList(buyerRole))
                    .status(UserStatus.ACTIVE)
                    .build();

            user = userRepository.save(user);
        } else {
            if (user.getStatus() != UserStatus.ACTIVE) {
                throw new BadRequestException("Tài khoản đã bị tạm khóa");
            }
            if (avatarUrl != null && user.getAvatarUrl() == null) {
                user.setAvatarUrl(avatarUrl);
            }
            user.setLastLoginAt(java.time.LocalDateTime.now());
            user = userRepository.save(user);
        }

        return buildAuthResponse(user);
    }

    public Map<String, Object> forgotPassword(ForgotPasswordRequest request) { return challenges.requestPasswordReset(request.getIdentifier()); }
    public void resetPassword(ResetPasswordRequest request) { challenges.resetPassword(request); }
    public QrLoginResponse generateQrSession() { return challenges.generateQr(); }
    public QrLoginResponse checkQrSession(String token, String pollSecret) { return challenges.pollQr(token, pollSecret); }
    public void confirmQrLogin(String token, Long authenticatedUser) { challenges.confirmQr(token, authenticatedUser); }
    public AuthResponse refreshToken(String refreshToken) { return sessions.rotate(refreshToken); }
    public void logout(String refreshToken) { sessions.logout(getCurrentUserId(),refreshToken); }
    public void logoutAll() { sessions.revokeAll(getCurrentUserId()); }

    public UserProfileResponse getProfile(Long userId) {
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return UserProfileResponse.from(user);
    }

    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone().isBlank()?null:request.getPhone());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl().isBlank()?null:request.getAvatarUrl());

        user = userRepository.save(user);
        return UserProfileResponse.from(user);
    }

    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BadRequestException("No authenticated user found");
        }
        return (Long) authentication.getPrincipal();
    }

    private AuthResponse buildAuthResponse(User user) { return sessions.issue(user); }
}
