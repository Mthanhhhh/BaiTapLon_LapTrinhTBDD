package com.team.gateway.filter;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import java.util.Arrays;

/** Validate the browser Origin before the gateway establishes its upstream socket. */
@Component
public class WebSocketOriginFilter implements GlobalFilter, Ordered {
    @Value("${app.promotions.allowed-origins:http://localhost:8082,http://localhost:8087}")
    private String origins;

    @Override public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if ("/ws/promotions".equals(exchange.getRequest().getURI().getPath())) {
            String origin=exchange.getRequest().getHeaders().getOrigin();
            // Native clients have no Origin; this channel only carries public invalidation/time.
            if (origin!=null && Arrays.stream(origins.split(",")).map(String::trim).noneMatch(origin::equals)) {
                exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
                return exchange.getResponse().setComplete();
            }
        }
        return chain.filter(exchange);
    }
    @Override public int getOrder() { return Ordered.HIGHEST_PRECEDENCE; }
}
