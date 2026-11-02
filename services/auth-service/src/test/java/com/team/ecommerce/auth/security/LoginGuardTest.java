package com.team.ecommerce.auth.security;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.*;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class LoginGuardTest {
 private Map<String,Object> row(int failures,Object locked){var r=new HashMap<String,Object>();r.put("status","ACTIVE");r.put("password_hash","original-hash");r.put("failed_login_count",failures);r.put("locked_until",locked);return r;}
 @Test void fifthFailureLocksWithoutChangingPassword(){var db=mock(JdbcTemplate.class);var encoder=mock(PasswordEncoder.class);var audit=mock(SecurityAudit.class);when(db.queryForMap(anyString(),eq(7L))).thenReturn(row(4,null));var guard=new LoginGuard(db,encoder,audit);assertThrows(BadCredentialsException.class,()->guard.verify(7L,"wrong"));verify(db).update(startsWith("UPDATE users SET failed_login_count="),eq(5),any(LocalDateTime.class),eq(7L));verify(encoder,never()).encode(any());}
 @Test void validLegacyCredentialResetsOnlyFailureFields(){var db=mock(JdbcTemplate.class);var encoder=mock(PasswordEncoder.class);when(db.queryForMap(anyString(),eq(7L))).thenReturn(row(2,null));when(encoder.matches("old6!x","original-hash")).thenReturn(true);new LoginGuard(db,encoder,mock(SecurityAudit.class)).verify(7L,"old6!x");verify(db).update(startsWith("UPDATE users SET failed_login_count=0"),eq(7L));verify(encoder,never()).encode(any());}
 @Test void temporaryLockRejectsEvenCorrectPassword(){var db=mock(JdbcTemplate.class);var encoder=mock(PasswordEncoder.class);when(db.queryForMap(anyString(),eq(7L))).thenReturn(row(5,LocalDateTime.now(ZoneOffset.UTC).plusMinutes(3)));var guard=new LoginGuard(db,encoder,mock(SecurityAudit.class));assertThrows(BadCredentialsException.class,()->guard.verify(7L,"correct"));verify(encoder,never()).matches("correct","original-hash");}
}
