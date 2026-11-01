package com.team.ecommerce.product.controller;

import com.team.ecommerce.product.service.*;
import com.team.ecommerce.shared.dto.ApiResponse;
import com.team.ecommerce.shared.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController @RequestMapping("/api/v1/ai/recommendations") @RequiredArgsConstructor
public class HomeRecommendationController {
 private final ProductService products;private final AiShoppingService ai;
 private record Ranking(List<Long> ids,long created,String signature){}
 private final ConcurrentHashMap<String,Ranking> sessions=new ConcurrentHashMap<>(),intents=new ConcurrentHashMap<>();
 private final ConcurrentHashMap<Long,Long> lastAiCall=new ConcurrentHashMap<>();
 public record Input(List<String> keywords,String sessionId,int page,int size){}
 @PostMapping public ApiResponse<?> home(@AuthenticationPrincipal Long user,@RequestBody Input input){
  if(input.sessionId()==null||!input.sessionId().matches("[A-Za-z0-9_-]{16,64}")||input.page()<0||input.page()>10000)throw new BadRequestException("Phiên đề xuất không hợp lệ.");
  var words=Optional.ofNullable(input.keywords()).orElse(List.of()).stream().filter(Objects::nonNull).map(String::trim).filter(s->!s.isBlank()).limit(5).map(s->s.substring(0,Math.min(s.length(),100))).toList();String keyword=String.join("|",words),key=(user==null?0:user)+":"+input.sessionId();long now=System.currentTimeMillis();
  if(sessions.size()>2000){sessions.entrySet().removeIf(e->now-e.getValue().created()>3600000);if(sessions.size()>2500)throw new BadRequestException("Có nhiều phiên đề xuất; vui lòng thử lại sau.");}
  if(intents.size()>500)intents.entrySet().removeIf(e->now-e.getValue().created()>1200000);
  var ranking=sessions.computeIfAbsent(key,k->{if(words.isEmpty())return new Ranking(List.of(),now,keyword);var prior=intents.get(keyword);if(prior!=null&&now-prior.created()<1200000)return prior;long uid=user==null?0:user;Long before=lastAiCall.put(uid,now);if(before!=null&&now-before<20000)return new Ranking(List.of(),now,keyword);var candidates=products.recommendations(keyword,0,50).getContent();var ids=ai.rankForHome(words,candidates);var result=new Ranking(ids,now,keyword);intents.put(keyword,result);return result;});
  if(!ranking.signature().equals(keyword))throw new BadRequestException("Từ khóa đã đổi; hãy bắt đầu phiên đề xuất mới.");
  return ApiResponse.success(Map.of("page",products.recommendations(keyword,input.page(),Math.max(1,Math.min(50,input.size())),ranking.ids()),"aiPowered",!ranking.ids().isEmpty(),"sessionId",input.sessionId()));
 }
}
