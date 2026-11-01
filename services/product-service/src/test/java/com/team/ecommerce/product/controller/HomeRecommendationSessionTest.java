package com.team.ecommerce.product.controller;
import org.junit.jupiter.api.Test;
import com.team.ecommerce.product.service.*;
import com.team.ecommerce.product.dto.ProductListResponse;
import com.team.ecommerce.shared.dto.PageResponse;
import com.team.ecommerce.shared.exception.BadRequestException;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;
class HomeRecommendationSessionTest {
 @Test void paginationReusesTheSameAiRanking(){var products=mock(ProductService.class);var ai=mock(AiShoppingService.class);var controller=new HomeRecommendationController(products,ai);var candidates=List.of(ProductListResponse.builder().id(1L).name("iPhone").stock(1).build());when(products.recommendations("iphone",0,50)).thenReturn(PageResponse.<ProductListResponse>builder().content(candidates).build());when(ai.rankForHome(List.of("iphone"),candidates)).thenReturn(List.of(1L));when(products.recommendations(eq("iphone"),anyInt(),eq(20),eq(List.of(1L)))).thenReturn(PageResponse.<ProductListResponse>builder().content(candidates).build());String session=UUID.randomUUID().toString();controller.home(7L,new HomeRecommendationController.Input(List.of("iphone"),session,0,20));controller.home(7L,new HomeRecommendationController.Input(List.of("iphone"),session,1,20));verify(ai,times(1)).rankForHome(anyList(),anyList());verify(products).recommendations("iphone",1,20,List.of(1L));assertThrows(BadRequestException.class,()->controller.home(7L,new HomeRecommendationController.Input(List.of("laptop"),session,1,20)));}
 @Test void guestWithoutSearchHistoryDoesNotCallGemini(){var products=mock(ProductService.class);var ai=mock(AiShoppingService.class);var controller=new HomeRecommendationController(products,ai);when(products.recommendations("",0,20,List.of())).thenReturn(PageResponse.<ProductListResponse>builder().content(List.of()).build());controller.home(null,new HomeRecommendationController.Input(List.of(),UUID.randomUUID().toString(),0,20));verifyNoInteractions(ai);}
}
