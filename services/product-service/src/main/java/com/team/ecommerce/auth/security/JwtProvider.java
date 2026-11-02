package com.team.ecommerce.auth.security;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.*;
@Component
public class JwtProvider {
 @Value("${app.jwt.secret}") private String jwtSecret;
 @Value("${app.jwt.expiration:900000}") private long jwtExpirationMs;
 @Value("${app.jwt.refresh-expiration:604800000}") private long jwtRefreshExpirationMs;
 @Value("${SECURITY_LEGACY_TOKEN_UNTIL:0}") private long legacyUntil;
 @PostConstruct public void validateConfiguration(){if(jwtSecret==null||io.jsonwebtoken.io.Decoders.BASE64.decode(jwtSecret).length<32)throw new IllegalArgumentException("JWT_SECRET must be Base64 encoding of at least 32 bytes");}
 private SecretKey key(){return Keys.hmacShaKeyFor(io.jsonwebtoken.io.Decoders.BASE64.decode(jwtSecret));}
 public long accessLifetime(){return jwtExpirationMs;}
 public Claims claims(String token){return Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token).getBody();}
 public String generateAccessToken(Long user,String email,String roles){return generateAccessToken(user,email,roles,0);}
 public String generateAccessToken(Long user,String email,String roles,int version){return builder(user,"access",version,jwtExpirationMs).claim("email",email).claim("role",roles).compact();}
 public String generateRefreshToken(Long user){return generateRefreshToken(user,UUID.randomUUID().toString(),0);}
 public String generateRefreshToken(Long user,String family,int version){return builder(user,"refresh",version,jwtRefreshExpirationMs).claim("sid",family).compact();}
 private JwtBuilder builder(Long user,String kind,int version,long duration){long now=System.currentTimeMillis();return Jwts.builder().setIssuer("eshop-auth").setAudience("eshop-api").setSubject(user.toString()).setId(UUID.randomUUID().toString()).claim("token_use",kind).claim("ver",version).setIssuedAt(new Date(now)).setExpiration(new Date(now+duration)).signWith(key(),SignatureAlgorithm.HS256);}
 public boolean validateAccessToken(String token){return validateKind(token,"access");}
 public boolean validateRefreshToken(String token){return validateKind(token,"refresh");}
 public boolean validateToken(String token){return validateAccessToken(token);}
 public boolean isLegacy(String token){return claims(token).get("token_use")==null;}
 private boolean validateKind(String token,String kind){if(token==null||token.length()>4096)return false;try{var c=claims(token);if(Long.parseLong(c.getSubject())<=0)return false;
  if(c.get("token_use")!=null)return kind.equals(c.get("token_use"))&&"eshop-auth".equals(c.getIssuer())&&"eshop-api".equals(c.getAudience())&&c.getId()!=null;
  if(legacyUntil<=0||System.currentTimeMillis()/1000>legacyUntil||c.getIssuedAt()==null||c.getIssuedAt().getTime()/1000>legacyUntil)return false;
  boolean access=c.get("email") instanceof String&&c.get("role") instanceof String;
  return kind.equals("access")==access;
 }catch(RuntimeException invalid){return false;}}
 public Long getUserIdFromToken(String token){return Long.parseLong(claims(token).getSubject());}
 public String getEmailFromToken(String token){return claims(token).get("email",String.class);}
 public int getSecurityVersion(String token){Object v=claims(token).get("ver");return v instanceof Number n?n.intValue():0;}
}
