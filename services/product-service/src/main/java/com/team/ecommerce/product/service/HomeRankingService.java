package com.team.ecommerce.product.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.ecommerce.shared.exception.BadRequestException;
import jakarta.annotation.PreDestroy;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;

/** AI warms future sessions; the current pagination snapshot never waits for or changes with AI. */
@Service
public class HomeRankingService {
    public record Ranking(List<Long> ids, String signature) {}
    private final ProductService products;
    private final AiShoppingService ai;
    private final StringRedisTemplate redis;
    private final ObjectMapper json;
    private final Executor executor;
    private final ThreadPoolExecutor ownedExecutor;

    @org.springframework.beans.factory.annotation.Autowired
    public HomeRankingService(ProductService products, AiShoppingService ai, StringRedisTemplate redis, ObjectMapper json) {
        this.products=products; this.ai=ai; this.redis=redis; this.json=json;
        ownedExecutor=new ThreadPoolExecutor(1,1,30,TimeUnit.SECONDS,new ArrayBlockingQueue<>(8),task->{
            Thread thread=new Thread(task,"home-ranking-warmup");thread.setDaemon(true);return thread;
        },new ThreadPoolExecutor.AbortPolicy());
        ownedExecutor.allowCoreThreadTimeOut(true);executor=ownedExecutor;
    }
    HomeRankingService(ProductService products,AiShoppingService ai,StringRedisTemplate redis,ObjectMapper json,Executor executor) {
        this.products=products;this.ai=ai;this.redis=redis;this.json=json;this.executor=executor;ownedExecutor=null;
    }
    public Ranking snapshot(Long user,String session,List<String> words,int page) {
        String keyword=String.join("|",words),signature=digest(keyword),key="home:v2:session:"+(user==null?0:user)+":"+session;
        try {
            String saved=redis.opsForValue().get(key);
            if(saved!=null)return validate(decode(saved),signature);
            String cached=words.isEmpty()?null:redis.opsForValue().get("home:v2:intent:"+signature);
            Ranking proposed=cached==null?new Ranking(List.of(),signature):validate(decode(cached),signature);
            if(!Boolean.TRUE.equals(redis.opsForValue().setIfAbsent(key,encode(proposed),Duration.ofHours(1)))) {
                String winner=redis.opsForValue().get(key);
                if(winner!=null)proposed=validate(decode(winner),signature);
            }
            if(!words.isEmpty()&&cached==null)warm(user,words,keyword,signature);
            return proposed;
        } catch(org.springframework.dao.DataAccessException unavailable) {
            // Initial catalog remains available; never silently reorder an already paginated AI session.
            if(page>0)throw new BadRequestException("Chưa thể tải tiếp đề xuất. Vui lòng thử lại hoặc làm mới danh sách.");
            return new Ranking(List.of(),signature);
        }
    }
    private void warm(Long user,List<String> words,String keyword,String signature) {
        String lock="home:v2:warming:"+signature;
        if(!Boolean.TRUE.equals(redis.opsForValue().setIfAbsent(lock,"1",Duration.ofSeconds(60))))return;
        String rate="home:v2:rate:"+(user==null?0:user);
        if(!Boolean.TRUE.equals(redis.opsForValue().setIfAbsent(rate,"1",Duration.ofSeconds(20)))){redis.delete(lock);return;}
        try {executor.execute(()->{
            try {
                var candidates=products.recommendations(keyword,0,50).getContent();
                List<Long> allowed=candidates.stream().map(p->p.getId()).toList();
                List<Long> ids=ai.rankForHome(words,candidates).stream().filter(allowed::contains).distinct().limit(16).toList();
                redis.opsForValue().set("home:v2:intent:"+signature,encode(new Ranking(ids,signature)),ids.isEmpty()?Duration.ofMinutes(2):Duration.ofMinutes(20));
            } catch(RuntimeException ignored) {
                // Recommendation is optional enrichment; failure cannot fail a catalog HTTP request.
            } finally {try{redis.delete(lock);}catch(RuntimeException ignored){}}
        });} catch(RejectedExecutionException full) {redis.delete(lock);}
    }
    private Ranking validate(Ranking ranking,String signature) {
        if(!signature.equals(ranking.signature()))throw new BadRequestException("Từ khóa đã đổi; hãy bắt đầu phiên đề xuất mới.");
        return ranking;
    }
    private Ranking decode(String raw) {try{return json.readValue(raw,Ranking.class);}catch(Exception invalid){throw new BadRequestException("Phiên đề xuất không hợp lệ. Vui lòng làm mới danh sách.");}}
    private String encode(Ranking value) {try{return json.writeValueAsString(value);}catch(Exception invalid){throw new IllegalStateException("Cannot serialize ranking snapshot");}}
    private static String digest(String text) {try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(text.getBytes(StandardCharsets.UTF_8)));}catch(Exception impossible){throw new IllegalStateException(impossible);}}
    @PreDestroy public void close(){if(ownedExecutor!=null)ownedExecutor.shutdownNow();}
}
