package com.team.ecommerce.shared.integration;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import jakarta.servlet.FilterChain;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MetricsAccessFilterTest {
    private static final String TOKEN = "test-only-00000000000000000000000000000000";
    @Test void rejectsAnonymousAndWrongCredentials() throws Exception {
        for (String token : new String[]{"", "Bearer wrong"}) {
            var request = new MockHttpServletRequest("GET", "/actuator/prometheus");
            if (!token.isEmpty()) request.addHeader("Authorization", token);
            var response = new MockHttpServletResponse();
            FilterChain chain = mock(FilterChain.class);
            new MetricsAccessFilter(TOKEN).doFilter(request, response, chain);
            assertEquals(403, response.getStatus());
            verifyNoInteractions(chain);
        }
    }
    @Test void encodedPathCannotBypassCredentialCheck() throws Exception {
        var request = new MockHttpServletRequest("GET", "/actuator/%70rometheus");
        request.setServletPath("/actuator/prometheus");
        var response = new MockHttpServletResponse();
        new MetricsAccessFilter(TOKEN).doFilter(request, response, mock(FilterChain.class));
        assertEquals(403, response.getStatus());
    }
    @Test void admitsDedicatedScrapeCredential() throws Exception {
        var request = new MockHttpServletRequest("GET", "/actuator/prometheus");
        request.addHeader("Authorization", "Bearer " + TOKEN);
        var response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        new MetricsAccessFilter(TOKEN).doFilter(request, response, chain);
        verify(chain).doFilter(request, response);
    }
    @Test void failsClosedWhenCredentialNotConfigured() throws Exception {
        var request = new MockHttpServletRequest("GET", "/actuator/prometheus");
        var response = new MockHttpServletResponse();
        new MetricsAccessFilter("").doFilter(request, response, mock(FilterChain.class));
        assertEquals(403, response.getStatus());
    }
}
