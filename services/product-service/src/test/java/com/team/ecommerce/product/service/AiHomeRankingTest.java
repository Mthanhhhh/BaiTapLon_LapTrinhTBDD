package com.team.ecommerce.product.service;
import org.junit.jupiter.api.Test;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
class AiHomeRankingTest {
 @Test void modelCannotAddUnknownDuplicateOrNonIntegerProducts()throws Exception{var json=new ObjectMapper().readTree("[2,999,2,1,1.5,\"3\",null,-1]");assertEquals(List.of(2L,1L),AiShoppingService.validateHomeRanking(json,List.of(1L,2L,3L)));}
 @Test void malformedRankingIsAnEmptyFallback()throws Exception{assertTrue(AiShoppingService.validateHomeRanking(new ObjectMapper().readTree("{}"),List.of(1L)).isEmpty());}
 @Test void rankingIsCappedWhileKeepingModelOrder(){var mapper=new ObjectMapper();var values=java.util.stream.LongStream.rangeClosed(1,40).boxed().toList();assertEquals(values.subList(0,16),AiShoppingService.validateHomeRanking(mapper.valueToTree(values),values));}
}
