package com.team.ecommerce.auth.controller;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class MobileOAuthCallbackControllerTest {
    private final MobileOAuthCallbackController controller=new MobileOAuthCallbackController();
    @Test void requiresStateAndAnAuthorizationResult(){
        assertEquals(400,controller.callback("code",null,null).getStatusCode().value());
        assertEquals(400,controller.callback(null,"state",null).getStatusCode().value());
    }
    @Test void relaysEncodedCodeOnlyToFixedScheme(){
        var response=controller.callback("a&redirect_uri=https://evil.example","valid-state",null);
        assertEquals(302,response.getStatusCode().value());
        var uri=response.getHeaders().getLocation();
        assertNotNull(uri);assertEquals("eshop",uri.getScheme());assertEquals("oauth",uri.getHost());
        assertTrue(uri.toASCIIString().contains("a%26redirect_uri%3Dhttps://evil.example"));
        assertEquals("no-store",response.getHeaders().getCacheControl());
    }
    @Test void cancellationDoesNotRelayUntrustedErrorText(){
        var response=controller.callback(null,"state","untrusted text");
        assertTrue(response.getHeaders().getLocation().toString().contains("error=access_denied"));
    }
}
