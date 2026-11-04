package com.team.ecommerce.product.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.ecommerce.product.dto.ProductListResponse;
import com.team.ecommerce.shared.dto.PageResponse;
import com.team.ecommerce.shared.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class HomeRankingServiceTest {
    @Test
    @SuppressWarnings("unchecked")
    void warmsFutureSessionsAndKeepsAnExistingSessionStableAcrossInstances() {
        var products = mock(ProductService.class);
        var ai = mock(AiShoppingService.class);
        var redis = mock(StringRedisTemplate.class);
        ValueOperations<String, String> values = mock(ValueOperations.class);
        var cache = new HashMap<String, String>();
        var tasks = new ArrayDeque<Runnable>();
        when(redis.opsForValue()).thenReturn(values);
        when(values.get(anyString())).thenAnswer(call -> cache.get(call.getArgument(0)));
        when(values.setIfAbsent(anyString(), anyString(), any(Duration.class)))
                .thenAnswer(call -> cache.putIfAbsent(call.getArgument(0), call.getArgument(1)) == null);
        doAnswer(call -> {
            cache.put(call.getArgument(0), call.getArgument(1));
            return null;
        }).when(values).set(anyString(), anyString(), any(Duration.class));

        var first = new HomeRankingService(products, ai, redis, new ObjectMapper(), tasks::add);
        var second = new HomeRankingService(products, ai, redis, new ObjectMapper(), tasks::add);
        var words = List.of("iphone");
        var candidates = List.of(ProductListResponse.builder().id(1L).build());
        when(products.recommendations("iphone", 0, 50))
                .thenReturn(PageResponse.<ProductListResponse>builder().content(candidates).build());
        when(ai.rankForHome(words, candidates)).thenReturn(List.of(99L, 1L, 1L));

        assertTrue(first.snapshot(null, "guest", List.of(), 0).ids().isEmpty());
        assertTrue(tasks.isEmpty());
        assertTrue(first.snapshot(7L, "initial", words, 0).ids().isEmpty());
        verifyNoInteractions(ai);
        tasks.remove().run();

        assertTrue(second.snapshot(7L, "initial", words, 1).ids().isEmpty());
        assertEquals(List.of(1L), second.snapshot(7L, "new", words, 0).ids());
        assertThrows(BadRequestException.class,
                () -> second.snapshot(7L, "initial", List.of("laptop"), 1));
        verify(ai).rankForHome(words, candidates);
    }
}
