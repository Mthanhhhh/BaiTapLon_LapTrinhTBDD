package com.team.ecommerce.auth.service;
import com.team.ecommerce.auth.dto.SocialLoginRequest;
import com.team.ecommerce.shared.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SocialOAuthServiceTest {
    private static final String CALLBACK="http://localhost:8082/oauth/callback";
    private SocialOAuthService configured(){return new SocialOAuthService("google-id","google-secret","fb-id","fb-secret",CALLBACK,"v24.0");}
    private SocialLoginRequest request(String provider){var r=new SocialLoginRequest();r.setProvider(provider);r.setCode("one-time-code");r.setRedirectUri(CALLBACK);r.setCodeVerifier("a".repeat(43));return r;}
    private HttpResponse<String> response(String body){return response(body,200);}
    private HttpResponse<String> response(String body,int status){return new HttpResponse<>(){
        public int statusCode(){return status;}
        public String body(){return body;}
        public HttpRequest request(){return null;}
        public java.util.Optional<HttpResponse<String>> previousResponse(){return java.util.Optional.empty();}
        public java.net.http.HttpHeaders headers(){return java.net.http.HttpHeaders.of(java.util.Map.of(),(a,b)->true);}
        public java.util.Optional<javax.net.ssl.SSLSession> sslSession(){return java.util.Optional.empty();}
        public java.net.URI uri(){return java.net.URI.create("https://provider.example");}
        public HttpClient.Version version(){return HttpClient.Version.HTTP_1_1;}
    };}
    @Test void rejectsEmailOnlyLegacyLogin(){var r=new SocialLoginRequest();r.setProvider("google");r.setRedirectUri(CALLBACK);assertThrows(BadRequestException.class,()->configured().exchange(r));}
    @Test void rejectsUnconfiguredProviders(){var s=new SocialOAuthService("","","","",CALLBACK,"v24.0");assertThrows(BadRequestException.class,()->s.exchange(request("google")));assertFalse(s.configuration().toString().contains("google-secret"));}
    @Test void rejectsUntrustedRedirects(){for(String redirect:new String[]{"https://evil.example/oauth/callback",CALLBACK+"/extra",CALLBACK+"?next=https://evil.example"}){var r=request("google");r.setRedirectUri(redirect);assertThrows(BadRequestException.class,()->configured().exchange(r));}}
    @Test void requiresPkce(){var r=request("google");r.setCodeVerifier(null);assertThrows(BadRequestException.class,()->configured().exchange(r));}
    @Test void rejectsUnknownProvider(){assertThrows(BadRequestException.class,()->configured().exchange(request("attacker")));}
    @Test void configurationDoesNotExposeSecrets(){String config=configured().configuration().toString();assertTrue(config.contains("google-id"));assertFalse(config.contains("google-secret"));assertFalse(config.contains("fb-secret"));}
    @Test void acceptsOnlyVerifiedGoogleIdentity() throws Exception {
        var http=mock(HttpClient.class);var s=new SocialOAuthService("google-id","google-secret","fb-id","fb-secret",CALLBACK,"v24.0",http);
        when(http.send(any(HttpRequest.class),org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<String>>any()))
            .thenReturn(response("{\"access_token\":\"provider-token\"}"),response("{\"sub\":\"google-subject\",\"email\":\"Verified@Example.com\",\"email_verified\":true,\"name\":\"Verified Person\"}"));
        var identity=s.exchange(request("google"));assertEquals("verified@example.com",identity.email());assertEquals("Verified Person",identity.name());
        var capture=org.mockito.ArgumentCaptor.forClass(HttpRequest.class);verify(http,times(2)).send(capture.capture(),org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<String>>any());
        assertEquals("https://oauth2.googleapis.com/token",capture.getAllValues().get(0).uri().toString());
        assertEquals("Bearer provider-token",capture.getAllValues().get(1).headers().firstValue("Authorization").orElseThrow());
    }
    @Test void refusesUnverifiedGoogleEmail() throws Exception {
        var http=mock(HttpClient.class);var s=new SocialOAuthService("google-id","google-secret","fb-id","fb-secret",CALLBACK,"v24.0",http);
        when(http.send(any(HttpRequest.class),org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<String>>any()))
            .thenReturn(response("{\"access_token\":\"token\"}"),response("{\"sub\":\"sub\",\"email\":\"unverified@example.com\",\"email_verified\":false}"));
        assertThrows(BadRequestException.class,()->s.exchange(request("google")));
    }
    @Test void refusesFacebookTokenForAnotherApp() throws Exception {
        var http=mock(HttpClient.class);var s=new SocialOAuthService("google-id","google-secret","fb-id","fb-secret",CALLBACK,"v24.0",http);
        when(http.send(any(HttpRequest.class),org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<String>>any()))
            .thenReturn(response("{\"access_token\":\"token\"}"),response("{\"data\":{\"is_valid\":true,\"app_id\":\"wrong-app\",\"user_id\":\"fb-user\"}}"));
        assertThrows(BadRequestException.class,()->s.exchange(request("facebook")));
    }
    @Test void refusesProviderDecline() throws Exception {
        var http=mock(HttpClient.class);var s=new SocialOAuthService("google-id","google-secret","fb-id","fb-secret",CALLBACK,"v24.0",http);
        HttpResponse<String> decline=response("{\"error\":\"invalid_grant\"}",400);
        when(http.send(any(HttpRequest.class),org.mockito.ArgumentMatchers.<HttpResponse.BodyHandler<String>>any())).thenReturn(decline);
        assertThrows(BadRequestException.class,()->s.exchange(request("google")));
    }
}
