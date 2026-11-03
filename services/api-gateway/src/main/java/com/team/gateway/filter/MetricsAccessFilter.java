package com.team.gateway.filter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
@Order(-210)
public class MetricsAccessFilter implements WebFilter {
    private final byte[] expected;
    public MetricsAccessFilter(@Value("${MONITORING_TOKEN:}") String token) {
        expected = token.length() >= 32 ? ("Bearer " + token).getBytes(StandardCharsets.UTF_8) : new byte[0];
    }
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        if (exchange.getRequest().getURI().getPath().equals("/actuator/prometheus")) {
            String provided = exchange.getRequest().getHeaders().getFirst("Authorization");
            if (expected.length == 0 || provided == null || !MessageDigest.isEqual(expected, provided.getBytes(StandardCharsets.UTF_8))) {
                exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                return exchange.getResponse().setComplete();
            }
        }
        return chain.filter(exchange);
    }
}
