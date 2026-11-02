package com.team.ecommerce.auth.security;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import java.util.Base64;
import static org.junit.jupiter.api.Assertions.*;
class JwtPurposeTest {
 private JwtProvider provider(){var jwt=new JwtProvider();ReflectionTestUtils.setField(jwt,"jwtSecret",Base64.getEncoder().encodeToString("012345678901234567890123456789012345678901234567".getBytes()));ReflectionTestUtils.setField(jwt,"jwtExpirationMs",900000L);ReflectionTestUtils.setField(jwt,"jwtRefreshExpirationMs",604800000L);jwt.validateConfiguration();return jwt;}
 @Test void tokenKindsAreNotInterchangeable(){var jwt=provider();String access=jwt.generateAccessToken(1L,"test@eshop.example","BUYER",3),refresh=jwt.generateRefreshToken(1L,"family",3);assertTrue(jwt.validateAccessToken(access));assertFalse(jwt.validateRefreshToken(access));assertTrue(jwt.validateRefreshToken(refresh));assertFalse(jwt.validateAccessToken(refresh));assertEquals(3,jwt.getSecurityVersion(access));}
 @Test void refreshTokensAreUniqueEvenIssuedImmediately(){var jwt=provider();assertNotEquals(jwt.generateRefreshToken(1L,"family",0),jwt.generateRefreshToken(1L,"family",0));}
 @Test void noWeakOrDefaultSigningKey(){var jwt=provider();ReflectionTestUtils.setField(jwt,"jwtSecret",Base64.getEncoder().encodeToString("weak".getBytes()));assertThrows(IllegalArgumentException.class,jwt::validateConfiguration);}
}
