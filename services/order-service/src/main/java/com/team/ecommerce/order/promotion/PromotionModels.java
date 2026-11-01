package com.team.ecommerce.order.promotion;
import java.math.BigDecimal;
import java.util.*;
public class PromotionModels {
 public record FlashInput(Long skuId,BigDecimal salePrice,int quota,int perUserLimit) {}
 public record CampaignInput(String name,String kind,String layer,String code,String discountType,BigDecimal value,BigDecimal minOrder,BigDecimal maxDiscount,BigDecimal budget,int quota,int perUserLimit,Boolean stackable,String startsAt,String endsAt,List<FlashInput> items,String audience,List<Long> recipientIds) {}
 public record QuoteInput(List<String> codes,Boolean autoBest,List<Long> cartItemIds,Long skuId,Integer quantity,@com.fasterxml.jackson.annotation.JsonIgnore List<Long> excluded,@com.fasterxml.jackson.annotation.JsonIgnore Map<Long,BigDecimal> virtualSpent,@com.fasterxml.jackson.annotation.JsonIgnore Map<Long,Integer> virtualUsed) {
  public QuoteInput(List<String> codes,Boolean autoBest,List<Long> ids,Long sku,Integer qty){this(codes,autoBest,ids,sku,qty,null,null,null);}
  public QuoteInput(List<String> codes,Boolean autoBest){this(codes,autoBest,null,null,null,null,null,null);}
 }
 public record Line(long cartItemId,long productId,long skuId,long shopId,String name,String variantName,String image,int quantity,BigDecimal basePrice,BigDecimal unitPrice,Long flashItemId,Long flashCampaignId) {
  public BigDecimal subtotal(){return unitPrice.multiply(BigDecimal.valueOf(quantity));}
  public BigDecimal saving(){return basePrice.subtract(unitPrice).multiply(BigDecimal.valueOf(quantity));}
 }
 public record Applied(long id,String code,String name,String layer,BigDecimal amount) {}
 public record Quote(List<Line> lines,BigDecimal originalSubtotal,BigDecimal subtotal,BigDecimal flashSavings,BigDecimal discount,BigDecimal shippingOriginal,BigDecimal shippingDiscount,BigDecimal fees,BigDecimal tax,BigDecimal total,List<Applied> applied,List<Map<String,Object>> vouchers,String quoteHash,String serverTime,BigDecimal vatIncluded,BigDecimal vatPercent) {}
}
