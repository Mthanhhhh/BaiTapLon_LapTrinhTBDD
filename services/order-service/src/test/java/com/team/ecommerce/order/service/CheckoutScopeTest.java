package com.team.ecommerce.order.service;

import com.team.ecommerce.order.repository.OrderRepository;
import com.team.ecommerce.order.promotion.PromotionModels.QuoteInput;
import com.team.ecommerce.shared.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CheckoutScopeTest {
    @Mock OrderRepository orders;
    @InjectMocks OrderService service;

    @Test void shopNativeQueryDoesNotReceiveJpaColumnSort() {
        when(orders.findShopOrders(eq(7L),any(Pageable.class))).thenReturn(Page.empty());
        service.getShopOrders(7L,PageRequest.of(2,15,Sort.by("createdAt").descending()));
        var paging=ArgumentCaptor.forClass(Pageable.class);
        verify(orders).findShopOrders(eq(7L),paging.capture());
        assertEquals(2,paging.getValue().getPageNumber());
        assertEquals(15,paging.getValue().getPageSize());
        assertTrue(paging.getValue().getSort().isUnsorted());
    }

    @Test void buyingRequiresExplicitNonemptyScope() {
        assertThrows(BadRequestException.class,()->service.quoteBasket(7L,new QuoteInput(List.of(),true,List.of(),null,null)));
        assertThrows(BadRequestException.class,()->service.quoteBasket(7L,new QuoteInput(List.of(),true,null,null,null)));
        verifyNoInteractions(orders);
    }

    @Test void directBuyCannotAlsoConsumeCartRows() {
        assertThrows(BadRequestException.class,()->service.quoteBasket(7L,new QuoteInput(List.of(),true,List.of(12L),233L,1)));
        verifyNoInteractions(orders);
    }
}
