package com.team.ecommerce.order.promotion;
import org.junit.jupiter.api.Test;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;
class PriceReadContextTest {
 @Test void referenceQueriesRunOnceWithinBatch(){var reads=new PromotionService.PriceReadContext();var count=new AtomicInteger();assertEquals(1,reads.read("used:1",count::incrementAndGet));assertEquals(1,reads.read("used:1",count::incrementAndGet));assertEquals(2,reads.read("used:2",count::incrementAndGet));assertEquals(2,count.get());}
 @Test void nextBuyerAndRequestHaveIndependentReads(){var count=new AtomicInteger();assertEquals(1,new PromotionService.PriceReadContext().read("used:1",count::incrementAndGet));assertEquals(2,new PromotionService.PriceReadContext().read("used:1",count::incrementAndGet));}
}
