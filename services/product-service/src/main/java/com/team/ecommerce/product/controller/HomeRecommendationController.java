package com.team.ecommerce.product.controller;
import com.team.ecommerce.product.service.*;
import com.team.ecommerce.shared.dto.ApiResponse;
import com.team.ecommerce.shared.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import java.util.*;

@RestController @RequestMapping("/api/v1/ai/recommendations") @RequiredArgsConstructor
public class HomeRecommendationController {
 private final ProductService products;
 private final HomeRankingService rankings;
 public record Input(List<String> keywords,String sessionId,int page,int size){}
 @PostMapping public ApiResponse<?> home(@AuthenticationPrincipal Long user,@RequestBody Input input){
  if(input.sessionId()==null||!input.sessionId().matches("[A-Za-z0-9_-]{16,64}")||input.page()<0||input.page()>10000)throw new BadRequestException("Phiên đề xuất không hợp lệ.");
  var words=Optional.ofNullable(input.keywords()).orElse(List.of()).stream().filter(Objects::nonNull).map(String::trim).filter(s->!s.isBlank()).limit(5).map(s->s.substring(0,Math.min(s.length(),100))).toList();
  var ranking=rankings.snapshot(user,input.sessionId(),words,input.page());
  return ApiResponse.success(Map.of("page",products.recommendations(String.join("|",words),input.page(),Math.max(1,Math.min(50,input.size())),ranking.ids()),"aiPowered",!ranking.ids().isEmpty(),"sessionId",input.sessionId()));
 }
}
