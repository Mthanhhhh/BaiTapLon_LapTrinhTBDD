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
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    private final Map<String, OtpEntry> otpCache = new ConcurrentHashMap<>();
    private final Map<String, QrSessionEntry> qrSessions = new ConcurrentHashMap<>();

    private record OtpEntry(String otp, long expiryTime) {}
    private record QrSessionEntry(String status, Long userId, AuthResponse authResponse, long expiryTime) {}

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
        User user = userRepository.findByIdentifier(identifier)
                .or(() -> userRepository.findByEmailAndDeletedAtIsNull(identifier))
                .orElseThrow(() -> new BadRequestException("Tài khoản hoặc mật khẩu không chính xác"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Tài khoản hoặc mật khẩu không chính xác");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException("Tài khoản đã bị tạm khóa hoặc vô hiệu hóa");
        }

        user.setLastLoginAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    public AuthResponse socialLogin(SocialLoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailAndDeletedAtIsNull(email).orElse(null);

        if (user == null) {
            Role buyerRole = roleRepository.findByCode(RoleEnum.BUYER)
                    .orElseThrow(() -> new ResourceNotFoundException("Role", "code", "BUYER"));

            String defaultName = request.getFullName() != null && !request.getFullName().isBlank() 
                    ? request.getFullName() 
                    : (email.contains("@") ? email.substring(0, email.indexOf("@")) : "Social User");

            user = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                    .fullName(defaultName)
                    .avatarUrl(request.getAvatarUrl())
                    .roles(Collections.singletonList(buyerRole))
                    .status(UserStatus.ACTIVE)
                    .build();

            user = userRepository.save(user);
        } else {
            if (user.getStatus() != UserStatus.ACTIVE) {
                throw new BadRequestException("Tài khoản đã bị tạm khóa");
            }
            if (request.getAvatarUrl() != null && user.getAvatarUrl() == null) {
                user.setAvatarUrl(request.getAvatarUrl());
            }
            user.setLastLoginAt(java.time.LocalDateTime.now());
            user = userRepository.save(user);
        }

        return buildAuthResponse(user);
    }

    public Map<String, Object> forgotPassword(ForgotPasswordRequest request) {
        String identifier = request.getIdentifier().trim();
        User user = userRepository.findByIdentifier(identifier)
                .or(() -> userRepository.findByEmailAndDeletedAtIsNull(identifier))
                .orElseThrow(() -> new ResourceNotFoundException("User", "identifier", identifier));

        String otp = String.format("%06d", new java.util.Random().nextInt(900000) + 100000);
        long expiry = System.currentTimeMillis() + (15 * 60 * 1000); // 15 phut
        otpCache.put(identifier, new OtpEntry(otp, expiry));

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Mã xác thực OTP đã được gửi thành công");
        result.put("identifier", identifier);
        result.put("otp", otp); // Tra ve OTP de nguoi dung test thuan tien
        return result;
    }

    public void resetPassword(ResetPasswordRequest request) {
        String identifier = request.getIdentifier().trim();
        OtpEntry entry = otpCache.get(identifier);

        if (entry == null || System.currentTimeMillis() > entry.expiryTime()) {
            throw new BadRequestException("Mã OTP không hợp lệ hoặc đã hết hạn");
        }

        if (!entry.otp().equals(request.getOtp().trim())) {
            throw new BadRequestException("Mã OTP không chính xác");
        }

        User user = userRepository.findByIdentifier(identifier)
                .or(() -> userRepository.findByEmailAndDeletedAtIsNull(identifier))
                .orElseThrow(() -> new ResourceNotFoundException("User", "identifier", identifier));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        otpCache.remove(identifier);
    }

    public QrLoginResponse generateQrSession() {
        String qrToken = "qr_" + java.util.UUID.randomUUID().toString().replace("-", "");
        long expiry = System.currentTimeMillis() + (3 * 60 * 1000); // 3 phut
        qrSessions.put(qrToken, new QrSessionEntry("PENDING", null, null, expiry));
        return QrLoginResponse.builder()
                .qrToken(qrToken)
                .status("PENDING")
                .build();
    }

    public QrLoginResponse checkQrSession(String qrToken) {
        QrSessionEntry entry = qrSessions.get(qrToken);
        if (entry == null || System.currentTimeMillis() > entry.expiryTime()) {
            return QrLoginResponse.builder().qrToken(qrToken).status("EXPIRED").build();
        }
        return QrLoginResponse.builder()
                .qrToken(qrToken)
                .status(entry.status())
                .authResponse(entry.authResponse())
                .build();
    }

    public void confirmQrLogin(String qrToken, Long userId) {
        QrSessionEntry entry = qrSessions.get(qrToken);
        if (entry == null || System.currentTimeMillis() > entry.expiryTime()) {
            throw new BadRequestException("Mã QR đã hết hạn");
        }
        User user = (userId != null) 
                ? userRepository.findByIdAndDeletedAtIsNull(userId).orElseThrow()
                : userRepository.findAll().stream().findFirst().orElseThrow();

        AuthResponse authResponse = buildAuthResponse(user);
        qrSessions.put(qrToken, new QrSessionEntry("CONFIRMED", user.getId(), authResponse, entry.expiryTime()));
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
