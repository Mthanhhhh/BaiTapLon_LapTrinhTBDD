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

    public OrderResponse createOrder(Long userId, CreateOrderRequest request) {
        Cart cart = cartRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new BadRequestException("Cart is empty"));

        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
        if (cartItems.isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        shops.requireSingleShop(cartItems);

        AddressInternalDTO address = authInternalService.getAddressByIdAndUserId(request.getAddressId(), userId);

        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderItem> orderItems = new ArrayList<>();

        for (CartItem cartItem : cartItems) {
            ProductInternalDTO product = productInternalService.getProductById(cartItem.getProductId());
            
            if (!product.isActive()) {
                throw new BadRequestException("Product is not active: " + product.getName());
            }

            BigDecimal price = product.getPrice();
            String variantName = null;
            
            if (cartItem.getVariantId() != null) {
                VariantInternalDTO variant = product.getVariants().stream()
                        .filter(v -> v.getId().equals(cartItem.getVariantId()))
                        .findFirst()
                        .orElseThrow(() -> new BadRequestException("Variant not found: " + cartItem.getVariantId()));
                price = variant.getPrice();
                variantName = variant.getName();
            }

            BigDecimal itemSubtotal = price.multiply(BigDecimal.valueOf(cartItem.getQuantity()));
            subtotal = subtotal.add(itemSubtotal);

            OrderItem orderItem = OrderItem.builder()
                    .shopId(cartItem.getShopId())
                    .productId(product.getId())
                    .variantId(cartItem.getVariantId())
                    .productName(product.getName())
                    .productImage(product.getThumbnailUrl())
                    .variantName(variantName)
                    .price(price)
                    .quantity(cartItem.getQuantity())
                    .subtotal(itemSubtotal)
                    .build();
            orderItems.add(orderItem);
        }

        BigDecimal discount = BigDecimal.ZERO;
        Long voucherId = null;
        String appliedVoucherCode = null;

        if (request.getVoucherCode() != null && !request.getVoucherCode().isBlank()) {
            VoucherResponse voucherResponse = voucherService.validateVoucher(request.getVoucherCode(), subtotal);
            discount = voucherResponse.getDiscountAmount();
            voucherId = voucherResponse.getId();
            appliedVoucherCode = voucherResponse.getCode();
        }

        BigDecimal tax = subtotal.subtract(discount).multiply(BigDecimal.valueOf(0.10));
        BigDecimal fees = BigDecimal.ZERO;
        BigDecimal total = subtotal.subtract(discount).add(tax).add(fees);

        OrderStatus initialStatus = (request.getPaymentMethod() != null && "COD".equalsIgnoreCase(request.getPaymentMethod().trim()))
                ? OrderStatus.WAITING_CONFIRMATION
                : OrderStatus.PENDING_PAYMENT;

        Order order = Order.builder()
                .orderNo("EC" + java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS")))
                .idempotencyKey(UUID.randomUUID().toString())
                .userId(userId)
                .currency("VND")
                .paymentMethod(request.getPaymentMethod())
                .status(initialStatus)
                .subtotal(subtotal)
                .discount(discount)
                .tax(tax)
                .fees(fees)
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

        for (OrderItem item : orderItems) {
            item.setOrder(order);
            orderItemRepository.save(item);
        }

        order.setItems(orderItems);

        // Reserve inventory only after the order snapshot has been persisted. If any SKU
        // reservation fails, compensate earlier reservations while the DB transaction rolls back.
        List<CartItem> deductedItems = new ArrayList<>();
        try {
            for (CartItem cartItem : cartItems) {
                productInternalService.deductStock(cartItem.getProductId(), cartItem.getVariantId(), cartItem.getQuantity());
                deductedItems.add(cartItem);
            }
        } catch (RuntimeException reservationError) {
            for (CartItem deductedItem : deductedItems) {
                try {
                    productInternalService.restoreStock(deductedItem.getProductId(), deductedItem.getVariantId(), deductedItem.getQuantity());
                } catch (RuntimeException compensationError) {
                    reservationError.addSuppressed(compensationError);
                }
            }
            throw reservationError;
        }

        if (voucherId != null) {
            voucherService.incrementUsedCount(voucherId);
        }

        cartItemRepository.deleteAllByCartIdInBulk(cart.getId());

        // Publish OrderCreatedEvent to Kafka
        List<OrderCreatedEvent.OrderItemEvent> eventItems = orderItems.stream()
                .map(oi -> OrderCreatedEvent.OrderItemEvent.builder()
                        .productId(oi.getProductId())
                        .variantId(oi.getVariantId())
                        .quantity(oi.getQuantity())
                        .build())
                .collect(Collectors.toList());

        eventPublisher.publishOrderCreated(OrderCreatedEvent.builder()
                .orderId(order.getId())
                .userId(userId)
                .totalAmount(order.getTotal())
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod().toString() : "VISA")
                .items(eventItems)
                .build());

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
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
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
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getStatus() != OrderStatus.PENDING_PAYMENT && order.getStatus() != OrderStatus.WAITING_CONFIRMATION) {
            throw new BadRequestException("Only pending or waiting confirmation orders can be cancelled");
        }

        for (OrderItem item : order.getItems()) {
            productInternalService.restoreStock(item.getProductId(), item.getVariantId(), item.getQuantity());
        }

        order.setStatus(OrderStatus.CANCELLED);
        order = orderRepository.save(order);

        String voucherCode = null;
        if (order.getVoucherId() != null) {
            Optional<Voucher> voucherOpt = voucherRepository.findById(order.getVoucherId());
            if (voucherOpt.isPresent()) {
                voucherCode = voucherOpt.get().getCode();
            }
        }
        
        return OrderResponse.from(order, voucherCode);
    }

    public PageResponse<OrderResponse> getShopOrders(Long userId, Pageable pageable) {
        var orders = orderRepository.findAll().stream().filter(o -> !o.getItems().isEmpty() && o.getItems().stream().allMatch(item -> shops.ownsProduct(userId,item.getProductId()))).map(o -> OrderResponse.from(o,null)).toList();
        int start = (int)Math.min(pageable.getOffset(),orders.size());
        int end = Math.min(start+pageable.getPageSize(),orders.size());
        return PageResponse.from(new org.springframework.data.domain.PageImpl<>(orders.subList(start,end),pageable,orders.size()));
    }

    public OrderResponse transition(Long userId, Long orderId, OrderStatus target) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new ResourceNotFoundException("Order","id",orderId));
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
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        order.setStatus(status);
        order = orderRepository.save(order);
        
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
