package com.team.ecommerce.auth.security;

import com.team.ecommerce.auth.dto.*;
import com.team.ecommerce.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.*;
import java.security.SecureRandom;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(noRollbackFor = AuthenticationException.class)
public class SecureChallenges {
    private final JdbcTemplate db;
    private final UserRepository users;
    private final SecuritySessions sessions;
    private final SecurityAudit audit;
    private final PasswordEncoder passwords;
    private final ObjectProvider<JavaMailSender> mail;
    private final SecureRandom random = new SecureRandom();
    @Value("${INTERNAL_SERVICE_TOKEN}") private String challengeSecret;
    @Value("${app.mail.from:}") private String mailFrom;

    private String identifier(String raw) { return raw.trim().toLowerCase(Locale.ROOT); }
    private String codeHash(String identifier, String code) { return SecuritySessions.digest(challengeSecret + ":reset:" + identifier + ":" + code); }

    public Map<String,Object> requestPasswordReset(String raw) {
        String identifier = identifier(raw);
        var account = users.findByIdentifier(identifier);
        JavaMailSender sender = mail.getIfAvailable();
        if (account.isPresent() && sender != null && !mailFrom.isBlank()) {
            var user = account.get();
            if (user.getStatus() == com.team.ecommerce.auth.entity.UserStatus.ACTIVE) {
                String code = String.format(Locale.ROOT, "%06d", random.nextInt(1_000_000));
                db.update("INSERT INTO auth_password_resets(identifier_hash,user_id,code_hash,expires_at) VALUES(?,?,?,DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 10 MINUTE)) ON DUPLICATE KEY UPDATE user_id=VALUES(user_id),code_hash=VALUES(code_hash),attempts=0,expires_at=VALUES(expires_at),consumed_at=NULL",
                        SecuritySessions.digest(identifier), user.getId(), codeHash(identifier, code));
                var message = new SimpleMailMessage();
                message.setFrom(mailFrom); message.setTo(user.getEmail());
                message.setSubject("E-Shop: xác nhận đặt lại mật khẩu");
                message.setText("Mã xác nhận của bạn: " + code + "\nMã hết hạn sau 10 phút. Không chia sẻ mã này.");
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override public void afterCommit() {
                        try { sender.send(message); audit.recordIndependent("PASSWORD_RESET_MAIL", user.getId(), "SENT"); }
                        catch (org.springframework.mail.MailException unavailable) { audit.recordIndependent("PASSWORD_RESET_MAIL", user.getId(), "DELIVERY_FAILED"); }
                    }
                });
            }
        }
        audit.record("PASSWORD_RESET_REQUEST", null, "ACCEPTED");
        // Same response for unknown/inactive accounts and unavailable SMTP; never expose OTPs.
        return Map.of("message", "Yêu cầu đã được tiếp nhận. Nếu tài khoản hợp lệ và dịch vụ email khả dụng, hướng dẫn sẽ được gửi đến email đã đăng ký.");
    }

    public void resetPassword(ResetPasswordRequest request) {
        String identifier = identifier(request.getIdentifier());
        var records = db.queryForList("SELECT * FROM auth_password_resets WHERE identifier_hash=? AND consumed_at IS NULL AND expires_at>UTC_TIMESTAMP(3) FOR UPDATE", SecuritySessions.digest(identifier));
        if (records.isEmpty()) throw invalidCode();
        var row = records.get(0); long user = ((Number) row.get("user_id")).longValue();
        if (((Number) row.get("attempts")).intValue() >= 5) throw invalidCode();
        if (!java.security.MessageDigest.isEqual(row.get("code_hash").toString().getBytes(java.nio.charset.StandardCharsets.UTF_8), codeHash(identifier, request.getOtp().trim()).getBytes(java.nio.charset.StandardCharsets.UTF_8))) {
            db.update("UPDATE auth_password_resets SET attempts=attempts+1 WHERE identifier_hash=?", SecuritySessions.digest(identifier));
            audit.record("PASSWORD_RESET", user, "DENIED"); throw invalidCode();
        }
        int changed = db.update("UPDATE users SET password_hash=?,failed_login_count=0,locked_until=NULL WHERE id=? AND status='ACTIVE' AND deleted_at IS NULL", passwords.encode(request.getNewPassword()), user);
        if (changed != 1) throw invalidCode();
        db.update("UPDATE auth_password_resets SET consumed_at=UTC_TIMESTAMP(3) WHERE identifier_hash=?", SecuritySessions.digest(identifier));
        sessions.revokeAll(user);
        audit.record("PASSWORD_RESET", user, "SUCCESS");
    }

    public QrLoginResponse generateQr() {
        byte[] secret = new byte[32]; random.nextBytes(secret);
        String token = "qr_" + UUID.randomUUID().toString().replace("-", "");
        String poll = Base64.getUrlEncoder().withoutPadding().encodeToString(secret);
        db.update("INSERT INTO auth_qr_sessions(qr_token,poll_hash,expires_at) VALUES(?,?,DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 3 MINUTE))", token, SecuritySessions.digest(poll));
        return QrLoginResponse.builder().qrToken(token).pollSecret(poll).status("PENDING").build();
    }

    public void confirmQr(String token, long authenticatedUser) {
        var user = users.findByIdAndDeletedAtIsNull(authenticatedUser).orElseThrow(SecureChallenges::invalidCode);
        if (user.getStatus() != com.team.ecommerce.auth.entity.UserStatus.ACTIVE) throw invalidCode();
        if (db.update("UPDATE auth_qr_sessions SET user_id=?,confirmed_at=UTC_TIMESTAMP(3) WHERE qr_token=? AND confirmed_at IS NULL AND consumed_at IS NULL AND expires_at>UTC_TIMESTAMP(3)", authenticatedUser, token) != 1) throw invalidCode();
        audit.record("QR_CONFIRM", authenticatedUser, "SUCCESS");
    }

    public QrLoginResponse pollQr(String token, String pollSecret) {
        var rows = db.queryForList("SELECT * FROM auth_qr_sessions WHERE qr_token=? AND poll_hash=? AND expires_at>UTC_TIMESTAMP(3) FOR UPDATE", token, SecuritySessions.digest(pollSecret));
        if (rows.isEmpty()) return QrLoginResponse.builder().qrToken(token).status("EXPIRED").build();
        var row = rows.get(0);
        if (row.get("consumed_at") != null) return QrLoginResponse.builder().qrToken(token).status("CONSUMED").build();
        if (row.get("confirmed_at") == null) return QrLoginResponse.builder().qrToken(token).status("PENDING").build();
        long user = ((Number) row.get("user_id")).longValue();
        var account = users.findByIdAndDeletedAtIsNull(user).orElseThrow(SecureChallenges::invalidCode);
        if (account.getStatus() != com.team.ecommerce.auth.entity.UserStatus.ACTIVE) throw invalidCode();
        db.update("UPDATE auth_qr_sessions SET consumed_at=UTC_TIMESTAMP(3) WHERE qr_token=?", token);
        audit.record("QR_LOGIN", user, "SUCCESS");
        return QrLoginResponse.builder().qrToken(token).status("CONFIRMED").authResponse(sessions.issue(account)).build();
    }

    private static BadCredentialsException invalidCode() { return new BadCredentialsException("Mã xác nhận không hợp lệ hoặc đã hết hạn."); }
}
