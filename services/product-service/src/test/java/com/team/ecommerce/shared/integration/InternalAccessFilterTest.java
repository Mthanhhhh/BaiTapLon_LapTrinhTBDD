package com.team.ecommerce.shared.integration;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.*;
import java.util.concurrent.atomic.AtomicBoolean;
import static org.junit.jupiter.api.Assertions.*;
class InternalAccessFilterTest {
 private final String key="01234567890123456789012345678901";
 @Test void rejectsMissingServiceCredential()throws Exception{var req=new MockHttpServletRequest("GET","/internal/domain/accounts/1");var res=new MockHttpServletResponse();var invoked=new AtomicBoolean();new InternalAccessFilter(key).doFilter(req,res,(a,b)->invoked.set(true));assertEquals(403,res.getStatus());assertFalse(invoked.get());}
 @Test void allowsMatchingCredentialAndPublicEndpoint()throws Exception{for(String uri:new String[]{"/internal/domain/accounts/1","/api/v1/products"}){var req=new MockHttpServletRequest("GET",uri);if(uri.startsWith("/internal"))req.addHeader("X-Service-Token",key);var invoked=new AtomicBoolean();new InternalAccessFilter(key).doFilter(req,new MockHttpServletResponse(),(a,b)->invoked.set(true));assertTrue(invoked.get());}}
 @Test void refusesWeakStartupSecret(){assertThrows(IllegalArgumentException.class,()->new InternalAccessFilter("short"));}
}
