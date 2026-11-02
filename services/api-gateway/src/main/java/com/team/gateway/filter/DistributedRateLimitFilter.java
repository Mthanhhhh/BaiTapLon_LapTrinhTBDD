package com.team.gateway.filter;
import org.springframework.cloud.gateway.filter.*;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import java.util.List;
/** Shared fixed-window counters; Nginx remains the fallback guard if Redis is unavailable. */
@Component
public class DistributedRateLimitFilter implements GlobalFilter,Ordered {
 private final ReactiveStringRedisTemplate redis;
 private static final DefaultRedisScript<Long> COUNTER=new DefaultRedisScript<>("local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n",Long.class);
 public DistributedRateLimitFilter(ReactiveStringRedisTemplate redis){this.redis=redis;}
 public int getOrder(){return -10;}
 public Mono<Void> filter(ServerWebExchange ex,GatewayFilterChain chain){
  String path=ex.getRequest().getPath().value();if(!path.startsWith("/api/"))return chain.filter(ex);
  boolean login=path.equals("/api/v1/auth/login");long seconds=login?60:1,limit=login?20:150;
  // The public listener is loopback-only; Nginx overwrites X-Real-IP before forwarding.
  String ip=ex.getRequest().getHeaders().getFirst("X-Real-IP");if(ip==null)ip=String.valueOf(ex.getRequest().getRemoteAddress());
  String key="rate:"+(login?"login:":"api:")+ip+":"+(System.currentTimeMillis()/1000/seconds);
  ex.getResponse().getHeaders().set("X-Gateway-Instance",System.getenv().getOrDefault("HOSTNAME","local"));
  return redis.execute(COUNTER,List.of(key),List.of(Long.toString(seconds))).next().onErrorReturn(0L).flatMap(count->{
   if(count<=limit)return chain.filter(ex);ex.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);ex.getResponse().getHeaders().set("Retry-After",Long.toString(seconds));return ex.getResponse().setComplete();
  });
 }
}
