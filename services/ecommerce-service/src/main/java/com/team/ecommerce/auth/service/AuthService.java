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
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

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
        User user = userRepository.findByEmailAndDeletedAtIsNull(request.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Invalid email or password");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException("User account is disabled or locked");
        }

        return buildAuthResponse(user);
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtProvider.validateToken(refreshToken)) {
            throw new BadRequestException("Invalid refresh token");
        }

        Long userId = jwtProvider.getUserIdFromToken(refreshToken);
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        return buildAuthResponse(user);
    }

    public UserProfileResponse getProfile(Long userId) {
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return UserProfileResponse.from(user);
    }

    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());

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

    private AuthResponse buildAuthResponse(User user) {
        String rolesStr = user.getRoles().stream()
                .map(r -> r.getCode().name())
                .collect(Collectors.joining(","));

        String accessToken = jwtProvider.generateAccessToken(user.getId(), user.getEmail(), rolesStr);
        String refreshToken = jwtProvider.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(86400000) // Example 1 day in ms
                .build();
    }
}
