package com.team.ecommerce.product.service;
import com.team.ecommerce.product.entity.*;
import com.team.ecommerce.product.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.*;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class ProductPageBatchTest {
 @Test void categoryLabelsAreLoadedOncePerPage(){
  var products=mock(ProductRepository.class);var categories=mock(CategoryRepository.class);
  var service=new ProductService(products,categories,null,null,null);
  Product first=Product.builder().categoryId(5L).name("A").build(),second=Product.builder().categoryId(5L).name("B").build();
  Category category=Category.builder().name("Điện thoại").build();category.setId(5L);
  var paging=PageRequest.of(0,20);when(products.findByDeletedAtIsNullAndStatus(ProductStatus.ACTIVE,paging)).thenReturn(new PageImpl<>(List.of(first,second),paging,2));
  when(categories.findAllById(List.of(5L))).thenReturn(List.of(category));
  var page=service.getProducts(paging);assertEquals(2,page.getContent().size());assertEquals("Điện thoại",page.getContent().get(0).getCategoryName());
  verify(categories).findAllById(List.of(5L));verify(categories,never()).findById(anyLong());
 }
}
