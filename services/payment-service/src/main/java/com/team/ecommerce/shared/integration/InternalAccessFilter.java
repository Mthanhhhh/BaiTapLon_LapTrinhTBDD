package com.team.ecommerce.shared.integration;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component @Order(-200)
public class InternalAccessFilter extends OncePerRequestFilter {
 private final byte[] expected;
 public InternalAccessFilter(@Value("${INTERNAL_SERVICE_TOKEN}")String token){if(token.length()<32)throw new IllegalArgumentException("INTERNAL_SERVICE_TOKEN must contain at least 32 characters");expected=token.getBytes(StandardCharsets.UTF_8);}
 @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)throws ServletException,IOException{
  if(request.getRequestURI().startsWith("/internal/")){
   String provided=request.getHeader("X-Service-Token");
   if(provided==null||!MessageDigest.isEqual(expected,provided.getBytes(StandardCharsets.UTF_8))){response.sendError(403);return;}
  }
  chain.doFilter(request,response);
 }
}
