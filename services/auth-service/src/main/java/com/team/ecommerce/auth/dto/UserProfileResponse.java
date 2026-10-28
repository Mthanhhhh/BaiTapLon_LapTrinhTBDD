package com.team.ecommerce.auth.dto;

import com.team.ecommerce.auth.entity.RoleEnum;
import com.team.ecommerce.auth.entity.User;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class UserProfileResponse {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private List<RoleEnum> roles;
    private LocalDateTime createdAt;

    public static UserProfileResponse from(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .roles(user.getRoles().stream().map(r -> r.getCode()).collect(java.util.stream.Collectors.toList()))
                .createdAt(user.getCreatedAt())
                .build();
    }
}
