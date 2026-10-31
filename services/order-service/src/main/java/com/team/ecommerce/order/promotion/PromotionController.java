package com.team.ecommerce.order.promotion;
import com.team.ecommerce.shared.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import static com.team.ecommerce.order.promotion.PromotionModels.*;
@RestController @RequestMapping("/api/v1/promotions") @RequiredArgsConstructor
public class PromotionController {
 private final PromotionService promotions;private final PromotionEvents events;
 @GetMapping("/catalog") public ApiResponse<?> catalog(@AuthenticationPrincipal Long user){return ApiResponse.success(Map.of("campaigns",user==null?events.cachedCatalog(()->promotions.catalog(null,false,false)):promotions.catalog(user,false,false),"serverTime",Instant.now().toString()));}
 @GetMapping("/wallet") public ApiResponse<?> wallet(@AuthenticationPrincipal Long user){return ApiResponse.success(promotions.catalog(user,true,false));}
 @PostMapping("/{id}/save") public ApiResponse<?> save(@AuthenticationPrincipal Long user,@PathVariable long id){promotions.save(user,id);return ApiResponse.success("Đã lưu mã; lưu mã không giữ lượt sử dụng");}
 @DeleteMapping("/{id}/save") public ApiResponse<?> unsave(@AuthenticationPrincipal Long user,@PathVariable long id){promotions.unsave(user,id);return ApiResponse.success("Đã bỏ lưu");}
 @PostMapping("/{id}/reminder") public ApiResponse<?> remind(@AuthenticationPrincipal Long user,@PathVariable long id){promotions.remind(user,id,true);return ApiResponse.success("Đã đăng ký nhắc trước 5 phút hoặc ngay khi gần giờ mở");}
 @DeleteMapping("/{id}/reminder") public ApiResponse<?> unremind(@AuthenticationPrincipal Long user,@PathVariable long id){promotions.remind(user,id,false);return ApiResponse.success("Đã bỏ nhắc");}
 @PostMapping("/quote") public ApiResponse<?> quote(@AuthenticationPrincipal Long user,@RequestBody(required=false) QuoteInput input){return ApiResponse.success(promotions.quote(user,input));}
 @GetMapping("/manage") public ApiResponse<?> manage(@AuthenticationPrincipal Long user){return ApiResponse.success(Map.of("campaigns",promotions.dashboard(user),"admin",promotions.admin(user),"shopId",Optional.ofNullable(promotions.shop(user)).orElse(0L)));}
 @PostMapping("/manage") public ApiResponse<?> create(@AuthenticationPrincipal Long user,@RequestBody CampaignInput input){return ApiResponse.success(Map.of("id",promotions.create(user,input)));}
 @PostMapping("/manage/{id}/cancel") public ApiResponse<?> cancel(@AuthenticationPrincipal Long user,@PathVariable long id){promotions.cancel(user,id);return ApiResponse.success("Đã dừng nhận lượt mới; đơn đã đặt giữ nguyên giá");}
 @PutMapping("/shipping-policy") public ApiResponse<?> shipping(@AuthenticationPrincipal Long user,@RequestBody Map<String,BigDecimal> input){promotions.shipping(user,input.get("fee"));return ApiResponse.success("Đã lưu phí giao shop quy định");}
 @GetMapping("/orders/{id}/pricing") public ApiResponse<?> snapshot(@AuthenticationPrincipal Long user,@PathVariable long id){return ApiResponse.success(promotions.snapshot(user,id));}
}
