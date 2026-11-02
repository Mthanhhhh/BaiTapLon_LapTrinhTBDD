package com.team.ecommerce.auth.security;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.util.*;
@Component @Order(-180) @RequiredArgsConstructor
public class AuthAbuseFilter extends OncePerRequestFilter {
 private final StringRedisTemplate redis;
 private static final DefaultRedisScript<Long> COUNT=new DefaultRedisScript<>("local n=redis.call('INCR',KEYS[1]);if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end;return n",Long.class);
 protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)throws java.io.IOException,ServletException {
  String path=request.getRequestURI();
  int limit=switch(path){case "/api/v1/auth/forgot-password"->3;case "/api/v1/auth/reset-password","/api/v1/auth/qr/generate"->10;case "/api/v1/auth/register"->10;case "/api/v1/auth/qr/check"->90;default->0;};
  if(limit>0){int seconds=path.contains("password")?600:60;String ip=Objects.toString(request.getHeader("X-Real-IP"),request.getRemoteAddr());String key="auth:abuse:"+path+":"+SecuritySessions.digest(ip)+":"+(System.currentTimeMillis()/1000/seconds);
   try{Long count=redis.execute(COUNT,List.of(key),Integer.toString(seconds));if(count!=null&&count>limit){response.setStatus(429);response.setHeader("Retry-After",Integer.toString(seconds));response.setContentType("application/json");response.getWriter().write("{\"status\":429,\"code\":\"RATE_LIMITED\",\"message\":\"Bạn thao tác quá nhanh. Vui lòng thử lại sau.\"}");return;}}
   catch(org.springframework.dao.DataAccessException unavailable){response.setStatus(503);response.setHeader("Retry-After","10");response.setContentType("application/json");response.getWriter().write("{\"status\":503,\"code\":\"TEMPORARILY_UNAVAILABLE\",\"message\":\"Vui lòng thử lại sau.\"}");return;}
  }
  chain.doFilter(request,response);
 }
}
