package com.team.ecommerce.shared.integration;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/** Dedicated scrape credential; buyer/admin JWTs never authorize metrics. */
@Component
@Order(-210)
public class MetricsAccessFilter extends OncePerRequestFilter {
    private final byte[] expected;
    public MetricsAccessFilter(@Value("${MONITORING_TOKEN:}") String token) {
        expected = token.length() >= 32 ? ("Bearer " + token).getBytes(StandardCharsets.UTF_8) : new byte[0];
    }
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getServletPath();
        if (path.isEmpty()) path = request.getRequestURI();
        if (path.equals("/actuator/prometheus")) {
            String provided = request.getHeader("Authorization");
            if (expected.length == 0 || provided == null || !MessageDigest.isEqual(expected, provided.getBytes(StandardCharsets.UTF_8))) {
                response.setStatus(403);
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
