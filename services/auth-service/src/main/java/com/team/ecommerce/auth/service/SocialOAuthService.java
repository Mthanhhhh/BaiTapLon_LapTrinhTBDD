package com.team.ecommerce.auth.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.ecommerce.auth.dto.SocialLoginRequest;
import com.team.ecommerce.shared.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

/** Exchanges one-time authorization codes server-side. Client profile fields are never trusted. */
@Service
public class SocialOAuthService {
    private final String googleId,googleSecret,facebookId,facebookSecret,redirects,graphVersion;
    private final HttpClient http;
    private final ObjectMapper json=new ObjectMapper();
    public record Identity(String email,String name,String picture) {}

    @org.springframework.beans.factory.annotation.Autowired
    public SocialOAuthService(
        @Value("${app.oauth.google-client-id:}") String googleId,
        @Value("${app.oauth.google-client-secret:}") String googleSecret,
        @Value("${app.oauth.facebook-app-id:}") String facebookId,
        @Value("${app.oauth.facebook-app-secret:}") String facebookSecret,
        @Value("${app.oauth.allowed-redirects:http://localhost:8082/oauth/callback}") String redirects,
        @Value("${app.oauth.facebook-graph-version:v24.0}") String graphVersion) {
        this(googleId,googleSecret,facebookId,facebookSecret,redirects,graphVersion,
            HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
    }
    SocialOAuthService(String googleId,String googleSecret,String facebookId,String facebookSecret,String redirects,String graphVersion,HttpClient http) {
        this.googleId=googleId;this.googleSecret=googleSecret;this.facebookId=facebookId;
        this.facebookSecret=facebookSecret;this.redirects=redirects;this.graphVersion=graphVersion;this.http=http;
    }

    public Map<String,Object> configuration() {
        return Map.of("google",Map.of("clientId",googleId,"configured",!googleId.isBlank()&&!googleSecret.isBlank()),
            "facebook",Map.of("clientId",facebookId,"configured",!facebookId.isBlank()&&!facebookSecret.isBlank()),
            "facebookGraphVersion",graphVersion);
    }

    public Identity exchange(SocialLoginRequest request) {
        String provider=request.getProvider();
        if (!"google".equals(provider)&&!"facebook".equals(provider)) throw new BadRequestException("Nhà cung cấp đăng nhập không hợp lệ");
        if (request.getCode()==null||request.getCode().isBlank()) throw new BadRequestException("Cần mã xác thực từ Google/Facebook");
        if (request.getRedirectUri()==null||Arrays.stream(redirects.split(",")).map(String::trim).noneMatch(request.getRedirectUri()::equals))
            throw new BadRequestException("Địa chỉ OAuth callback chưa được cho phép");
        String clientId="google".equals(provider)?googleId:facebookId;
        String secret="google".equals(provider)?googleSecret:facebookSecret;
        if(clientId.isBlank()||secret.isBlank())throw new BadRequestException("Chưa cấu hình ứng dụng đăng nhập "+provider+" trên máy chủ");
        if("google".equals(provider)&&(request.getCodeVerifier()==null||!request.getCodeVerifier().matches("[A-Za-z0-9._~-]{43,128}")))
            throw new BadRequestException("Thiếu mã bảo vệ phiên đăng nhập PKCE");
        try {
            Map<String,String> form=new LinkedHashMap<>();
            form.put("client_id",clientId);form.put("client_secret",secret);form.put("code",request.getCode());
            form.put("redirect_uri",request.getRedirectUri());form.put("grant_type","authorization_code");
            if("google".equals(provider))form.put("code_verifier",request.getCodeVerifier());
            String tokenUrl="google".equals(provider)?"https://oauth2.googleapis.com/token":"https://graph.facebook.com/"+graphVersion+"/oauth/access_token";
            JsonNode token=send(HttpRequest.newBuilder(URI.create(tokenUrl)).header("Content-Type","application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(encode(form))).timeout(Duration.ofSeconds(10)).build());
            String accessToken=token.path("access_token").asText();
            if(accessToken.isBlank())throw new BadRequestException("Nhà cung cấp không trả về phiên đăng nhập hợp lệ");
            JsonNode profile;
            if("google".equals(provider)) {
                profile=send(HttpRequest.newBuilder(URI.create("https://openidconnect.googleapis.com/v1/userinfo"))
                    .header("Authorization","Bearer "+accessToken).timeout(Duration.ofSeconds(10)).GET().build());
                if(!profile.path("email_verified").asBoolean(false)||profile.path("sub").asText().isBlank())
                    throw new BadRequestException("Tài khoản Google chưa xác minh email");
            } else {
                JsonNode debug=send(HttpRequest.newBuilder(URI.create("https://graph.facebook.com/"+graphVersion+"/debug_token?"+
                    encode(Map.of("input_token",accessToken,"access_token",facebookId+"|"+facebookSecret))))
                    .timeout(Duration.ofSeconds(10)).GET().build()).path("data");
                if(!debug.path("is_valid").asBoolean(false)||!facebookId.equals(debug.path("app_id").asText())||debug.path("user_id").asText().isBlank())
                    throw new BadRequestException("Phiên Facebook không thuộc ứng dụng này");
                profile=send(HttpRequest.newBuilder(URI.create("https://graph.facebook.com/"+graphVersion+"/me?fields=id,name,email,picture.type(large)"))
                    .header("Authorization","Bearer "+accessToken).timeout(Duration.ofSeconds(10)).GET().build());
                if(!debug.path("user_id").asText().equals(profile.path("id").asText()))throw new BadRequestException("Không xác minh được chủ tài khoản Facebook");
            }
            String email=profile.path("email").asText().trim().toLowerCase(java.util.Locale.ROOT);
            if(email.isBlank())throw new BadRequestException("Cần cho phép chia sẻ email để đăng nhập. Bạn có thể dùng đăng nhập bằng mật khẩu.");
            String picture="google".equals(provider)?profile.path("picture").asText():profile.path("picture").path("data").path("url").asText();
            return new Identity(email,profile.path("name").asText(),picture);
        } catch(BadRequestException e){throw e;}
        catch(InterruptedException e){Thread.currentThread().interrupt();throw new BadRequestException("Phiên đăng nhập bị gián đoạn. Vui lòng thử lại.");}
        catch(Exception e){throw new BadRequestException("Không kết nối được nhà cung cấp đăng nhập. Vui lòng thử lại.");}
    }
    private JsonNode send(HttpRequest request) throws Exception {
        HttpResponse<String> response=http.send(request,HttpResponse.BodyHandlers.ofString());
        if(response.statusCode()!=200)throw new BadRequestException("Nhà cung cấp từ chối phiên đăng nhập. Vui lòng đăng nhập lại.");
        return json.readTree(response.body());
    }
    private static String encode(Map<String,String> values){return values.entrySet().stream()
        .map(e->URLEncoder.encode(e.getKey(),StandardCharsets.UTF_8)+"="+URLEncoder.encode(e.getValue(),StandardCharsets.UTF_8))
        .collect(java.util.stream.Collectors.joining("&"));}
}
