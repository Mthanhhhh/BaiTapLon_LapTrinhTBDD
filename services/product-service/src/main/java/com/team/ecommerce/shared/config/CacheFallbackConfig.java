package com.team.ecommerce.shared.config;
import org.springframework.context.annotation.Configuration;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.cache.Cache;
@Configuration
public class CacheFallbackConfig implements CachingConfigurer {
 public CacheErrorHandler errorHandler(){return new CacheErrorHandler(){
 public void handleCacheGetError(RuntimeException e,Cache c,Object k){}
 public void handleCachePutError(RuntimeException e,Cache c,Object k,Object v){}
 public void handleCacheEvictError(RuntimeException e,Cache c,Object k){}
 public void handleCacheClearError(RuntimeException e,Cache c){}
 };}
}
