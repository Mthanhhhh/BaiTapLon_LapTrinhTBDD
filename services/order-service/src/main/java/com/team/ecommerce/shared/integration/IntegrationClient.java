package com.team.ecommerce.shared.integration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import java.util.*;

@Component
public class IntegrationClient {
 private final Map<String,RestClient> clients;
 public IntegrationClient(@Value("${INTERNAL_SERVICE_TOKEN}")String token,@Value("${services.auth.url:http://localhost:8083}")String auth,@Value("${services.product.url:http://localhost:8084}")String product,@Value("${services.order.url:http://localhost:8085}")String order,@Value("${services.payment.url:http://localhost:8086}")String payment){
  var factory=new SimpleClientHttpRequestFactory();factory.setConnectTimeout(2000);factory.setReadTimeout(8000);
  var map=new HashMap<String,RestClient>();for(var entry:Map.of("auth",auth,"product",product,"order",order,"payment",payment).entrySet())map.put(entry.getKey(),RestClient.builder().baseUrl(entry.getValue()).requestFactory(factory).defaultHeader("X-Service-Token",token).build());clients=Map.copyOf(map);
 }
 public Map<String,Object> get(String service,String path){return clients.get(service).get().uri(path).retrieve().body(Map.class);}
 public Map<String,Object> post(String service,String path,Object body){return clients.get(service).post().uri(path).body(body).retrieve().body(Map.class);}
 public void command(String service,String action,Map<String,?> body){post(service,"/internal/domain/"+action,body);}
 public Map<String,Object> account(long user){return get("auth","/internal/domain/accounts/"+user);}
 public boolean admin(long user){var account=account(user);return "ACTIVE".equals(account.get("status"))&&account.get("deletedAt")==null&&((List<?>)account.getOrDefault("roles",List.of())).contains("ADMIN");}
 public void requireAdmin(long user){if(!admin(user))throw new org.springframework.security.access.AccessDeniedException("Chỉ quản trị viên được phép thao tác.");}
}
