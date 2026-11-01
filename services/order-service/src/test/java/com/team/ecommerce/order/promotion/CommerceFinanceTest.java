package com.team.ecommerce.order.promotion;
import com.team.ecommerce.order.service.CommerceFinanceService;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CommerceFinanceTest {
 private static BigDecimal d(String value){return new BigDecimal(value);}
 @Test void extractsIncludedTaxInsteadOfAddingTaxAgain(){
  assertEquals(d("10000"),CommerceFinanceService.includedVat(d("110000"),d("10")));
  assertEquals(d("0"),CommerceFinanceService.includedVat(d("110000"),d("0")));
  assertEquals(d("8182"),CommerceFinanceService.includedVat(d("90000"),d("10")));
 }
 @Test void platformCouponIsFundedByPlatformAndNotDeductedTwiceFromSeller(){
  var db=mock(JdbcTemplate.class);
  when(db.queryForList(anyString(),eq(7L))).thenReturn(List.of(new HashMap<>(Map.of("vatPercent",10,"commissionPercent",5))));
  var service=new CommerceFinanceService(db);
  var line=new PromotionModels.Line(1,2,3,7,"Product","SKU","",1,d("100000"),d("100000"),null,null);
  var quote=new PromotionModels.Quote(List.of(line),d("100000"),d("100000"),d("0"),d("15000"),d("30000"),d("30000"),d("0"),d("0"),d("85000"),List.of(new PromotionModels.Applied(1,"SHOP","shop","SHOP",d("10000")),new PromotionModels.Applied(2,"PLATFORM","platform","PLATFORM",d("5000"))),List.of(),"hash","now",d("8182"),d("10"));
  service.snapshot(99,quote);
  var args=mockingDetails(db).getInvocations().stream().filter(i->i.getMethod().getName().equals("update")).findFirst().orElseThrow().getArguments();
  assertEquals(d("90000"),args[6]); // Merchant goods revenue includes the platform subsidy.
  assertEquals(d("8182"),args[7]);
  assertEquals(d("4500"),args[8]);
  assertEquals(d("85500"),args[9]); // Shipping is never merchant goods revenue.
 }
}
