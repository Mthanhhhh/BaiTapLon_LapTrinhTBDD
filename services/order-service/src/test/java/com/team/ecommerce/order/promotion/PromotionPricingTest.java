package com.team.ecommerce.order.promotion;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
class PromotionPricingTest {
 private final PromotionService service=new PromotionService(mock(JdbcTemplate.class),mock(PromotionEvents.class));
 private static BigDecimal d(String v){return new BigDecimal(v);}
 private Map<String,Object> coupon(String name,String layer,String type,String value,boolean stack,String budget){var c=new HashMap<String,Object>();c.put("name",name);c.put("layer",layer);c.put("discount_type",type);c.put("value",d(value));c.put("stackable",stack);c.put("budget_total",d(budget));c.put("budget_spent",BigDecimal.ZERO);c.put("budget_reserved",BigDecimal.ZERO);return c;}
 @Test void percentageIsCappedAndCannotMakePriceNegative(){assertEquals(d("20000"),PromotionService.discount("PERCENT",d("50"),d("20000"),d("100000")));assertEquals(d("5000"),PromotionService.discount("FIXED",d("20000"),null,d("5000")));}
 @Test void roundsVndDiscountConsistently(){assertEquals(d("1500"),PromotionService.discount("PERCENT",d("15"),null,d("9999")));}
 @Test void choosesStackedCombinationOverLargerExclusiveCoupon(){var list=List.of(coupon("exclusive","SHOP","FIXED","20000",false,"100000"),coupon("shop","SHOP","FIXED","15000",true,"100000"),coupon("platform","PLATFORM","FIXED","10000",true,"100000"));assertEquals(List.of("shop","platform"),service.best(list,d("100000"),BigDecimal.ZERO,true).stream().map(c->c.get("name")).toList());}
 @Test void exclusiveCouponWinsWhenActuallyCheaper(){var list=List.of(coupon("exclusive","SHOP","FIXED","40000",false,"100000"),coupon("shop","SHOP","FIXED","10000",true,"100000"),coupon("platform","PLATFORM","FIXED","10000",true,"100000"));assertEquals(List.of("exclusive"),service.best(list,d("100000"),BigDecimal.ZERO,true).stream().map(c->c.get("name")).toList());}
 @Test void neverChoosesCouponWhoseBudgetCannotCoverDiscount(){var insufficient=coupon("empty","SHOP","FIXED","20000",true,"10000");var valid=coupon("valid","SHOP","FIXED","5000",true,"5000");assertEquals(List.of(valid),service.best(List.of(insufficient,valid),d("100000"),BigDecimal.ZERO,true));}
 @Test void shippingVoucherCannotDiscountProductsWhenShippingIsFree(){var shipping=coupon("shipping","SHIPPING","FIXED","30000",true,"100000");assertTrue(service.best(List.of(shipping),d("100000"),BigDecimal.ZERO,true).isEmpty());assertEquals(List.of(shipping),service.best(List.of(shipping),d("100000"),d("15000"),true));}
 @Test void incompatibleManualCombinationIsNotSilentlyReplaced(){var a=coupon("a","SHOP","FIXED","10000",false,"100000");var b=coupon("b","PLATFORM","FIXED","10000",true,"100000");assertTrue(service.best(List.of(a,b),d("100000"),BigDecimal.ZERO,false).isEmpty());}
 @Test void oneCouponFromEachLayerAndSequentialPercentage(){var a=coupon("shop","SHOP","PERCENT","20",true,"100000");var b=coupon("platform","PLATFORM","PERCENT","10",true,"100000");var c=coupon("shipping","SHIPPING","FIXED","30000",true,"100000");assertEquals(List.of(a,b,c),service.best(List.of(a,b,c),d("100000"),d("30000"),true));}
}
