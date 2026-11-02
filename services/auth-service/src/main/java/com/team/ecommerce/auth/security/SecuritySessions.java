package com.team.ecommerce.auth.security;

import com.team.ecommerce.auth.dto.AuthResponse;
import com.team.ecommerce.auth.entity.User;
import com.team.ecommerce.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.Timestamp;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SecuritySessions {
    private final JdbcTemplate db;
    private final JwtProvider jwt;
    private final UserRepository users;
    private final SecurityAudit audit;

    public static String digest(String raw) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8))); }
        catch (java.security.NoSuchAlgorithmException impossible) { throw new IllegalStateException(impossible); }
    }

    @Transactional
    public AuthResponse issue(User user) { return issue(user, UUID.randomUUID().toString()); }

    private AuthResponse issue(User user, String family) {
        int version = db.queryForObject("SELECT security_version FROM users WHERE id=?", Integer.class, user.getId());
        String roles = user.getRoles().stream().map(role -> role.getCode().name()).collect(Collectors.joining(","));
        String refresh = jwt.generateRefreshToken(user.getId(), family, version);
        db.update("INSERT INTO auth_refresh_sessions(token_hash,user_id,family_id,expires_at) VALUES(?,?,?,?)",
                digest(refresh), user.getId(), family, new Timestamp(jwt.claims(refresh).getExpiration().getTime()));
        return AuthResponse.builder().accessToken(jwt.generateAccessToken(user.getId(), user.getEmail(), roles, version))
                .refreshToken(refresh).expiresIn(jwt.accessLifetime()).build();
    }

    @Transactional(noRollbackFor = AuthenticationException.class)
    public AuthResponse rotate(String raw) {
        if (!jwt.validateRefreshToken(raw)) throw rejected();
        long userId = jwt.getUserIdFromToken(raw);
        String hash = digest(raw);
        var accounts = db.queryForList("SELECT status,security_version FROM users WHERE id=? AND deleted_at IS NULL",userId);
        if(accounts.isEmpty()||!"ACTIVE".equals(accounts.get(0).get("status"))||((Number)accounts.get(0).get("security_version")).intValue()!=jwt.getSecurityVersion(raw))throw rejected();
        // Narrow, time-limited adoption of pre-upgrade refresh JWTs preserves existing sessions.
        // Access JWTs are never accepted here, including legacy JWTs carrying role/email.
        if (jwt.isLegacy(raw)) db.update("INSERT IGNORE INTO auth_refresh_sessions(token_hash,user_id,family_id,expires_at) VALUES(?,?,?,?)",
                hash, userId, UUID.randomUUID().toString(), new Timestamp(jwt.claims(raw).getExpiration().getTime()));
        var records = db.queryForList("SELECT * FROM auth_refresh_sessions WHERE token_hash=? FOR UPDATE", hash);
        if (records.isEmpty()) throw rejected();
        var row = records.get(0);
        String family = row.get("family_id").toString();
        if (row.get("used_at") != null || row.get("revoked_at") != null) {
            db.update("UPDATE auth_refresh_sessions SET revoked_at=COALESCE(revoked_at,UTC_TIMESTAMP(3)) WHERE family_id=?", family);
            audit.record("REFRESH_REUSE", userId, "FAMILY_REVOKED");
            throw rejected();
        }
        var state = db.queryForMap("SELECT status,security_version FROM users WHERE id=? AND deleted_at IS NULL", userId);
        if (!"ACTIVE".equals(state.get("status")) || ((Number) state.get("security_version")).intValue() != jwt.getSecurityVersion(raw)) throw rejected();
        User user = users.findByIdAndDeletedAtIsNull(userId).orElseThrow(SecuritySessions::rejected);
        AuthResponse next = issue(user, family);
        db.update("UPDATE auth_refresh_sessions SET used_at=UTC_TIMESTAMP(3),replacement_hash=? WHERE token_hash=?", digest(next.getRefreshToken()), hash);
        audit.record("REFRESH_ROTATED", userId, "SUCCESS");
        return next;
    }

    @Transactional
    public void revokeAll(long user) {
        db.update("UPDATE users SET security_version=security_version+1 WHERE id=?", user);
        db.update("UPDATE auth_refresh_sessions SET revoked_at=COALESCE(revoked_at,UTC_TIMESTAMP(3)) WHERE user_id=?", user);
        db.update("DELETE FROM refresh_tokens WHERE user_id=?", user);
        audit.record("SESSIONS_REVOKED", user, "SUCCESS");
    }

    @Transactional
    public void logout(long user, String refresh) {
        if (refresh != null && !refresh.isBlank()) {
            var families=db.queryForList("SELECT family_id FROM auth_refresh_sessions WHERE token_hash=? AND user_id=?",String.class,digest(refresh),user);
            if(!families.isEmpty())db.update("UPDATE auth_refresh_sessions SET revoked_at=COALESCE(revoked_at,UTC_TIMESTAMP(3)) WHERE user_id=? AND family_id=?",user,families.get(0));
        }
        audit.record("LOGOUT", user, "SUCCESS");
    }

    private static BadCredentialsException rejected() { return new BadCredentialsException("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."); }
}
