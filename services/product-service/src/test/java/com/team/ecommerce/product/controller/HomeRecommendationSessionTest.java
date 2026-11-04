package com.team.ecommerce.product.controller;

import com.team.ecommerce.product.dto.ProductListResponse;
import com.team.ecommerce.product.service.HomeRankingService;
import com.team.ecommerce.product.service.ProductService;
import com.team.ecommerce.shared.dto.PageResponse;
import com.team.ecommerce.shared.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class HomeRecommendationSessionTest {
    private final ProductService products = mock(ProductService.class);
    private final HomeRankingService rankings = mock(HomeRankingService.class);
    private MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.standaloneSetup(new HomeRecommendationController(products, rankings))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @Test
    void returnsTheRequestedPageUsingNormalizedKeywordsAndBoundedPageSize() throws Exception {
        var session = "test-session-12345";
        when(rankings.snapshot(null, session, List.of("iphone"), 1))
                .thenReturn(new HomeRankingService.Ranking(List.of(42L), "signature"));
        when(products.recommendations("iphone", 1, 50, List.of(42L)))
                .thenReturn(PageResponse.<ProductListResponse>builder().content(List.of()).build());

        mvc.perform(post("/api/v1/ai/recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"sessionId":"test-session-12345","keywords":[" iphone ",""],"page":1,"size":99}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.aiPowered").value(true))
                .andExpect(jsonPath("$.data.sessionId").value(session))
                .andExpect(jsonPath("$.data.page.content").isArray());
        verify(products).recommendations("iphone", 1, 50, List.of(42L));
    }

    @Test
    void rejectsInvalidSessionBeforeAccessingData() throws Exception {
        mvc.perform(post("/api/v1/ai/recommendations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"sessionId":"invalid","keywords":[],"page":0,"size":20}
                                """))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(products, rankings);
    }
}
