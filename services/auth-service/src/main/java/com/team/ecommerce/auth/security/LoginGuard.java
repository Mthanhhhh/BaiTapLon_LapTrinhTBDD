package com.team.ecommerce.auth.security;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
public class LoginGuard {
    public static final String FAILURE = "Tài khoản hoặc mật khẩu không chính xác";
    private final JdbcTemplate db;
    private final PasswordEncoder passwords;
    private final SecurityAudit audit;
    private String dummyHash;

    @PostConstruct void initialize() { dummyHash = passwords.encode(java.util.UUID.randomUUID().toString()); }

    public void missingAccount(String password) {
        passwords.matches(password, dummyHash);
        audit.record("LOGIN", null, "DENIED");
        throw new BadCredentialsException(FAILURE);
    }

    @Transactional(noRollbackFor = AuthenticationException.class)
    public void verify(long user, String password) {
        var row = db.queryForMap("SELECT password_hash,status,failed_login_count,locked_until FROM users WHERE id=? AND deleted_at IS NULL FOR UPDATE", user);
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        Object locked = row.get("locked_until");
        LocalDateTime until = locked instanceof java.sql.Timestamp t ? t.toLocalDateTime() : (LocalDateTime) locked;
        if (!"ACTIVE".equals(row.get("status")) || until != null && until.isAfter(now)) {
            passwords.matches(password, dummyHash);
            audit.record("LOGIN", user, "DENIED");
            throw new BadCredentialsException(FAILURE);
        }
        if (!passwords.matches(password, row.get("password_hash").toString())) {
            int failures = until != null ? 1 : ((Number) row.get("failed_login_count")).intValue() + 1;
            db.update("UPDATE users SET failed_login_count=?,locked_until=? WHERE id=?", failures,
                    failures >= 5 ? now.plusMinutes(5) : null, user);
            audit.record("LOGIN", user, failures >= 5 ? "TEMP_LOCKED" : "DENIED");
            throw new BadCredentialsException(FAILURE);
        }
        db.update("UPDATE users SET failed_login_count=0,locked_until=NULL,last_login_at=UTC_TIMESTAMP(3) WHERE id=?", user);
        audit.record("LOGIN", user, "SUCCESS");
    }
}
