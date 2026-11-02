package com.team.ecommerce.shared.integration;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
@Component
public class ServiceInstanceFilter extends OncePerRequestFilter {
 protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)throws java.io.IOException,ServletException{
  response.setHeader("X-Service-Instance",System.getenv().getOrDefault("HOSTNAME","local"));chain.doFilter(request,response);
 }
}
