package com.team.ecommerce.order.service;

import com.team.ecommerce.auth.internal.AddressInternalDTO;
import com.team.ecommerce.auth.internal.AuthInternalService;
import com.team.ecommerce.order.dto.CreateOrderRequest;
import com.team.ecommerce.order.dto.OrderResponse;
import com.team.ecommerce.order.dto.VoucherResponse;
import com.team.ecommerce.order.entity.*;
import com.team.ecommerce.order.repository.CartItemRepository;
import com.team.ecommerce.order.repository.CartRepository;
import com.team.ecommerce.order.repository.OrderItemRepository;
import com.team.ecommerce.order.repository.OrderRepository;
import com.team.ecommerce.order.repository.VoucherRepository;
import com.team.ecommerce.product.internal.ProductInternalDTO;
import com.team.ecommerce.product.internal.ProductInternalService;
import com.team.ecommerce.product.internal.VariantInternalDTO;
import com.team.ecommerce.shared.dto.PageResponse;
import com.team.ecommerce.shared.event.EventPublisher;
import com.team.ecommerce.shared.event.OrderCreatedEvent;
import com.team.ecommerce.shared.exception.BadRequestException;
import com.team.ecommerce.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional("orderTransactionManager")
public class OrderService {

    private final OrderRepository orderRepository;
    private final ShopAccessService shops;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final VoucherRepository voucherRepository;
    private final VoucherService voucherService;
    private final ProductInternalService productInternalService;
    private final AuthInternalService authInternalService;
    private final EventPublisher eventPublisher;
    private final JdbcTemplate jdbc;
    private final com.team.ecommerce.order.promotion.PromotionService promotions;
    private final com.team.ecommerce.order.promotion.PromotionEvents promotionEvents;

    public OrderResponse createOrder(Long userId, CreateOrderRequest request) {
        String method=java.util.Objects.toString(request.getPaymentMethod(),"").trim().toUpperCase(java.util.Locale.ROOT);
        if(!java.util.Set.of("COD","VISA","MAESTRO","PAYPAL").contains(method))throw new BadRequestException("Phương thức thanh toán không được hỗ trợ");
        request.setPaymentMethod(method);
        Cart cart = cartRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new BadRequestException("Cart is empty"));

        String key=userId+":"+request.getIdempotencyKey();
        var previous=orderRepository.findByIdempotencyKey(key);
        if(previous.isPresent())return OrderResponse.from(previous.get(),null);
        promotionEvents.throttle(userId);
        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
        if (cartItems.isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        shops.requireSingleShop(cartItems);

        AddressInternalDTO address = authInternalService.getAddressByIdAndUserId(request.getAddressId(), userId);

        java.util.List<String> codes=request.getVoucherCodes();
        if((codes==null||codes.isEmpty())&&request.getVoucherCode()!=null&&!request.getVoucherCode().isBlank())codes=List.of(request.getVoucherCode());
        var quote=promotions.quote(userId,new com.team.ecommerce.order.promotion.PromotionModels.QuoteInput(codes,request.getAutoBest()));
        if(!quote.quoteHash().equals(request.getQuoteHash()))throw new BadRequestException("Giá hoặc ưu đãi đã thay đổi. Vui lòng cập nhật bảng tính tiền trước khi đặt.");
        BigDecimal subtotal=quote.subtotal(),discount=quote.discount(),tax=quote.tax(),fees=BigDecimal.ZERO,total=quote.total();
        Long voucherId=null;String appliedVoucherCode=quote.applied().stream().map(a->a.code()).collect(java.util.stream.Collectors.joining(", "));
        List<OrderItem> orderItems=new ArrayList<>();
        for(var line:quote.lines())orderItems.add(OrderItem.builder().shopId(line.shopId()).productId(line.productId()).variantId(line.skuId()).productName(line.name()).productImage(line.image()).variantName(line.variantName()).price(line.unitPrice()).quantity(line.quantity()).subtotal(line.subtotal()).build());

        OrderStatus initialStatus = (request.getPaymentMethod() != null && "COD".equalsIgnoreCase(request.getPaymentMethod().trim()))
                ? OrderStatus.WAITING_CONFIRMATION
                : OrderStatus.PENDING_PAYMENT;

        Order order = Order.builder()
                .orderNo("EC"+UUID.randomUUID().toString().replace("-","").substring(0,26))
                .idempotencyKey(key)
                .userId(userId)
                .currency("VND")
                .paymentMethod(request.getPaymentMethod())
                .status(initialStatus)
                .subtotal(subtotal)
                .discount(discount)
                .tax(tax)
                .fees(fees)
                .shippingFee(quote.fees())
                .total(total)
                .voucherId(voucherId)
                .shippingName(address.getFullName())
                .shippingPhone(address.getPhone())
                .shippingStreet(address.getStreet())
                .shippingCity(address.getCity())
                .shippingDistrict(address.getDistrict())
                .shippingCountry("VN")
                .note(request.getNote())
                .build();

        order = orderRepository.save(order);
        shops.notifyBuyer(order);

        for (OrderItem item : orderItems) {
            item.setOrder(order);
            orderItemRepository.save(item);
        }

        order.setItems(orderItems);

        // One InnoDB transaction covers order, promotion counters and SKU stock across schemas.
        orderRepository.flush();
        promotions.reserve(userId,order.getId(),quote,initialStatus==OrderStatus.WAITING_CONFIRMATION);

        cartItemRepository.deleteAllByCartIdInBulk(cart.getId());

        promotionEvents.enqueue("ORDER_CREATED",java.util.Map.of("orderId",order.getId(),"userId",userId,"total",total,"paymentMethod",request.getPaymentMethod()));

        shops.notifyBuyer(order);
        return OrderResponse.from(order, appliedVoucherCode);
    }

    public PageResponse<OrderResponse> getOrders(Long userId, Pageable pageable) {
        Page<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        Page<OrderResponse> responsePage = orders.map(order -> {
            String voucherCode = null;
            if (order.getVoucherId() != null) {
                Optional<Voucher> voucherOpt = voucherRepository.findById(order.getVoucherId());
                if (voucherOpt.isPresent()) {
                    voucherCode = voucherOpt.get().getCode();
                }
            }
            return OrderResponse.from(order, voucherCode);
        });
        return PageResponse.from(responsePage);
    }

    public OrderResponse getOrderById(Long userId, Long orderId) {
        Order order = orderRepository.findForUpdate(orderId).filter(o->o.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        
        String voucherCode = null;
        if (order.getVoucherId() != null) {
            Optional<Voucher> voucherOpt = voucherRepository.findById(order.getVoucherId());
            if (voucherOpt.isPresent()) {
                voucherCode = voucherOpt.get().getCode();
            }
        }
        
        return OrderResponse.from(order, voucherCode);
    }

    public OrderResponse cancelOrder(Long userId, Long orderId) {
        Order order = orderRepository.findForUpdate(orderId).filter(o->o.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if(order.getStatus()==OrderStatus.CANCELLED)return OrderResponse.from(order,null);
        if (order.getStatus() != OrderStatus.PENDING_PAYMENT && order.getStatus() != OrderStatus.WAITING_CONFIRMATION) {
            throw new BadRequestException("Only pending or waiting confirmation orders can be cancelled");
        }

        if(!promotions.release(order.getId()))for (OrderItem item : order.getItems()) {
            productInternalService.restoreStock(item.getProductId(), item.getVariantId(), item.getQuantity());
        }

        order.setStatus(OrderStatus.CANCELLED);
        order = orderRepository.save(order);
        shops.notifyBuyer(order);

        String voucherCode = null;
        if (order.getVoucherId() != null) {
            Optional<Voucher> voucherOpt = voucherRepository.findById(order.getVoucherId());
            if (voucherOpt.isPresent()) {
                voucherCode = voucherOpt.get().getCode();
            }
        }
        
        return OrderResponse.from(order, voucherCode);
    }

    public OrderResponse rejectOrder(Long userId, Long orderId) {
        Order order = orderRepository.findForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        shops.requireOwner(userId, order.getItems());
        if(order.getStatus()==OrderStatus.CANCELLED)return OrderResponse.from(order,null);
        if (order.getStatus() != OrderStatus.WAITING_CONFIRMATION) {
            throw new BadRequestException("Chỉ có thể từ chối đơn đang chờ xác nhận");
        }
        if(!promotions.release(order.getId()))for (OrderItem item : order.getItems()) {
            productInternalService.restoreStock(item.getProductId(), item.getVariantId(), item.getQuantity());
        }
        order.setStatus(OrderStatus.CANCELLED);
        shops.notifyBuyer(order);
        return OrderResponse.from(orderRepository.save(order), null);
    }

    public PageResponse<OrderResponse> getShopOrders(Long userId, Pageable pageable) {
        return PageResponse.from(orderRepository.findShopOrders(userId,pageable).map(o->OrderResponse.from(o,null)));
    }

    public OrderResponse transition(Long userId, Long orderId, OrderStatus target) {
        Order order = orderRepository.findForUpdate(orderId).orElseThrow(() -> new ResourceNotFoundException("Order","id",orderId));
        OrderStatus expected;
        if (target == OrderStatus.WAITING_PICKUP || target == OrderStatus.SHIPPING) {
            shops.requireOwner(userId,order.getItems());
            expected = target == OrderStatus.WAITING_PICKUP ? OrderStatus.WAITING_CONFIRMATION : OrderStatus.WAITING_PICKUP;
        } else {
            if (!order.getUserId().equals(userId)) throw new org.springframework.security.access.AccessDeniedException("Order belongs to another buyer");
            expected = target == OrderStatus.DELIVERED ? OrderStatus.SHIPPING : OrderStatus.DELIVERED;
        }
        if (order.getStatus()!=expected) throw new BadRequestException("Trạng thái đơn hàng không hợp lệ");
        return updateOrderStatus(orderId,target);
    }

    public OrderResponse updateOrderStatus(Long orderId, OrderStatus status) {
        Order order = orderRepository.findForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        if(status==OrderStatus.WAITING_CONFIRMATION){
            if(order.getStatus()==status)return OrderResponse.from(order,null);
            if(order.getStatus()!=OrderStatus.PENDING_PAYMENT)throw new BadRequestException("Đơn không còn chờ thanh toán");
            promotions.commit(orderId);
        }
        boolean newlyDelivered = status == OrderStatus.DELIVERED && order.getStatus() != OrderStatus.DELIVERED;
        order.setStatus(status);
        order = orderRepository.save(order);
        shops.notifyBuyer(order);
        promotionEvents.enqueue("ORDER_STATUS_CHANGED",java.util.Map.of("orderId",orderId,"status",status.name()));
        if (newlyDelivered) {
            for (OrderItem item : order.getItems()) {
                jdbc.update("UPDATE product_db.products SET sold_count=sold_count+? WHERE id=?", item.getQuantity(), item.getProductId());
                if (item.getVariantId() != null) jdbc.update("UPDATE product_db.product_skus SET sold_count=sold_count+? WHERE id=? AND product_id=?", item.getQuantity(), item.getVariantId(), item.getProductId());
            }
        }
        
        String voucherCode = null;
        if (order.getVoucherId() != null) {
            Optional<Voucher> voucherOpt = voucherRepository.findById(order.getVoucherId());
            if (voucherOpt.isPresent()) {
                voucherCode = voucherOpt.get().getCode();
            }
        }
        return OrderResponse.from(order, voucherCode);
    }
}
