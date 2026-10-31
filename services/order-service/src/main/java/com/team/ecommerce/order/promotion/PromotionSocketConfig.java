package com.team.ecommerce.order.promotion;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.listener.*;
import org.springframework.web.socket.config.annotation.*;
@Configuration @EnableWebSocket @RequiredArgsConstructor
public class PromotionSocketConfig implements WebSocketConfigurer {
 private final PromotionEvents events;
 @Value("${app.promotions.allowed-origins:http://localhost:8082,http://localhost:8087}") private String origins;
 @Override public void registerWebSocketHandlers(WebSocketHandlerRegistry registry){registry.addHandler(events,"/ws/promotions").setAllowedOrigins(origins.split(","));}
 @Bean RedisMessageListenerContainer promotionPubSub(RedisConnectionFactory factory){var container=new RedisMessageListenerContainer();container.setConnectionFactory(factory);container.addMessageListener((message,pattern)->events.broadcast(),new ChannelTopic("eshop:promotions"));return container;}
}
