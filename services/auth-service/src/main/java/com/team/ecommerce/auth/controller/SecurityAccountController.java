package com.team.ecommerce.auth.controller;

import com.team.ecommerce.auth.service.AuthService;
import com.team.ecommerce.shared.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth/security")
@RequiredArgsConstructor
public class SecurityAccountController {
    private final JdbcTemplate db;
    private final AuthService auth;

    @GetMapping("/sessions")
    public ApiResponse<?> sessions() {
        return ApiResponse.success(db.queryForList("SELECT family_id AS id,MIN(created_at) AS createdAt,MAX(expires_at) AS expiresAt,MAX(used_at) AS lastUsedAt,MAX(revoked_at) AS revokedAt FROM auth_refresh_sessions WHERE user_id=? GROUP BY family_id ORDER BY createdAt DESC LIMIT 100", auth.getCurrentUserId()));
    }

    @DeleteMapping("/sessions/{family}")
    public ApiResponse<?> revoke(@PathVariable String family) {
        db.update("UPDATE auth_refresh_sessions SET revoked_at=COALESCE(revoked_at,UTC_TIMESTAMP(3)) WHERE user_id=? AND family_id=?", auth.getCurrentUserId(), family);
        return ApiResponse.success("Đã thu hồi phiên đăng nhập");
    }

    @GetMapping("/audit")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<?> audit(@RequestParam(defaultValue="0") int page) {
        return ApiResponse.success(db.queryForList("SELECT id,user_id AS userId,event_type AS eventType,outcome,request_id AS requestId,created_at AS createdAt FROM security_audit ORDER BY id DESC LIMIT 50 OFFSET ?",Math.max(0,Math.min(page,10000))*50));
    }
}
