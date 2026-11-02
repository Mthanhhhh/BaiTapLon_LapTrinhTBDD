package com.team.ecommerce.order.service;
import com.team.ecommerce.order.entity.*;
import com.team.ecommerce.order.repository.OrderRepository;
import com.team.ecommerce.shared.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
@ExtendWith(MockitoExtension.class)
class ReturnSafetyTest {
 @Mock OrderRepository orderRepository; @Mock JdbcTemplate jdbc; @InjectMocks OrderService service;
 @Test void returnRequiresDetailedReason(){assertThrows(BadRequestException.class,()->service.requestReturn(1L,2L,"ngắn"));verifyNoInteractions(orderRepository,jdbc);}
 @Test void otherBuyerCannotReturnOrder(){when(orderRepository.findForUpdate(2L)).thenReturn(Optional.of(Order.builder().userId(99L).status(OrderStatus.DELIVERED).build()));assertThrows(AccessDeniedException.class,()->service.requestReturn(1L,2L,"Sản phẩm nhận được bị hỏng"));verifyNoInteractions(jdbc);}
 @Test void undeliveredOrderCannotBeReturned(){when(orderRepository.findForUpdate(2L)).thenReturn(Optional.of(Order.builder().userId(1L).status(OrderStatus.SHIPPING).build()));assertThrows(BadRequestException.class,()->service.requestReturn(1L,2L,"Sản phẩm nhận được bị hỏng"));verifyNoInteractions(jdbc);}
 @Test void priorReturnCannotCreateDuplicateRequest(){when(orderRepository.findForUpdate(2L)).thenReturn(Optional.of(Order.builder().userId(1L).status(OrderStatus.DELIVERED).build()));when(jdbc.queryForObject("SELECT COUNT(*) FROM order_returns WHERE order_id=?",Long.class,2L)).thenReturn(1L);assertThrows(BadRequestException.class,()->service.requestReturn(1L,2L,"Sản phẩm nhận được bị hỏng"));verify(jdbc,never()).update(anyString(),any(Object[].class));}
}
