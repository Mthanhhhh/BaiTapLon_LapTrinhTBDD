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
    private final CommerceFinanceService finance;
    private final com.team.ecommerce.order.promotion.PromotionService promotions;
    private final com.team.ecommerce.order.promotion.PromotionEvents promotionEvents;

    public record CheckoutGroup(java.util.List<Long> cartItemIds,Long skuId,Integer quantity,java.util.List<Long> excluded,com.team.ecommerce.order.promotion.PromotionModels.Quote quote) {}
    public record BasketQuote(java.util.List<CheckoutGroup> groups,String quoteHash,java.math.BigDecimal total) {}
    public BasketQuote quoteBasket(Long user,com.team.ecommerce.order.promotion.PromotionModels.QuoteInput input){
        if(input==null||(input.skuId()!=null&&input.cartItemIds()!=null))throw new BadRequestException("Chỉ chọn mua ngay hoặc giỏ hàng");
        var scopes=new java.util.ArrayList<java.util.List<Long>>();
        if(input.skuId()==null){
            if(input.cartItemIds()==null||input.cartItemIds().isEmpty()||input.cartItemIds().size()>100)throw new BadRequestException("Chọn 1–100 dòng giỏ hàng");
            var rows=jdbc.queryForList("SELECT i.id,p.shop_id FROM cart_items i JOIN carts c ON c.id=i.cart_id JOIN product_db.products p ON p.id=i.product_id WHERE c.user_id=? ORDER BY p.shop_id,i.id",user);
            var byShop=new java.util.LinkedHashMap<Long,java.util.List<Long>>();
            for(var row:rows)if(input.cartItemIds().contains(((Number)row.get("id")).longValue()))byShop.computeIfAbsent(((Number)row.get("shop_id")).longValue(),key->new java.util.ArrayList<>()).add(((Number)row.get("id")).longValue());
            if(byShop.values().stream().mapToInt(java.util.List::size).sum()!=new java.util.HashSet<>(input.cartItemIds()).size())throw new BadRequestException("Giỏ hàng đã thay đổi");
            scopes.addAll(byShop.values());
        }else scopes.add(null);
        if(scopes.size()>10)throw new BadRequestException("Tối đa 10 shop mỗi lần thanh toán");
        var groups=new java.util.ArrayList<CheckoutGroup>();var excluded=new java.util.ArrayList<Long>();var spent=new java.util.HashMap<Long,BigDecimal>();var uses=new java.util.HashMap<Long,Integer>();
        for(var ids:scopes){
            var before=java.util.List.copyOf(excluded);
            var codes=input.codes();
            if(ids!=null&&codes!=null){long shop=jdbc.queryForObject("SELECT p.shop_id FROM cart_items i JOIN product_db.products p ON p.id=i.product_id WHERE i.id=?",Long.class,ids.get(0));var applicable=jdbc.queryForList("SELECT code FROM promo_campaigns WHERE shop_id IS NULL OR shop_id=?",String.class,shop);codes=codes.stream().filter(code->applicable.contains(code)&&!jdbc.queryForList("SELECT id FROM promo_campaigns WHERE code=?",Long.class,code).stream().anyMatch(excluded::contains)).toList();}
            var quote=promotions.quote(user,new com.team.ecommerce.order.promotion.PromotionModels.QuoteInput(codes,input.autoBest(),ids,input.skuId(),input.quantity(),before,spent,uses));
            groups.add(new CheckoutGroup(ids,input.skuId(),input.quantity(),before,quote));
            for(var applied:quote.applied()){
                spent.merge(applied.id(),applied.amount(),BigDecimal::add);uses.merge(applied.id(),1,Integer::sum);
                var counts=jdbc.queryForMap("SELECT per_user_limit,(SELECT COUNT(*) FROM promo_redemptions d JOIN promo_reservations r ON r.order_id=d.order_id WHERE d.campaign_id=c.id AND r.user_id=? AND r.state<>'RELEASED') AS used FROM promo_campaigns c WHERE id=?",user,applied.id());
                if(((Number)counts.get("used")).intValue()+uses.get(applied.id())>=((Number)counts.get("per_user_limit")).intValue())excluded.add(applied.id());
            }
        }
        if(Boolean.FALSE.equals(input.autoBest())&&input.codes()!=null){var applied=groups.stream().flatMap(g->g.quote().applied().stream()).map(a->a.code()).collect(java.util.stream.Collectors.toSet());for(String code:input.codes())if(!applied.contains(code.trim().toUpperCase(java.util.Locale.ROOT)))throw new BadRequestException("Mã "+code+" không áp dụng cho sản phẩm đã chọn");}
        String hash=groups.stream().map(group->group.quote().quoteHash()).collect(java.util.stream.Collectors.joining("."));
        return new BasketQuote(groups,hash,groups.stream().map(group->group.quote().total()).reduce(BigDecimal.ZERO,BigDecimal::add));
    }
    public java.util.List<OrderResponse> createBasket(Long user,CreateOrderRequest request){
        var previous=orderRepository.findByIdempotencyKey(user+":"+request.getIdempotencyKey()+"_0");
        if(previous.isPresent()){var result=new java.util.ArrayList<OrderResponse>();for(int i=0;i<10;i++){var row=orderRepository.findByIdempotencyKey(user+":"+request.getIdempotencyKey()+"_"+i);if(row.isEmpty())break;result.add(OrderResponse.from(row.get(),null));}return result;}
        promotionEvents.throttle(user);
        var draft=quoteBasket(user,new com.team.ecommerce.order.promotion.PromotionModels.QuoteInput(request.getVoucherCodes(),request.getAutoBest(),request.getCartItemIds(),request.getSkuId(),request.getQuantity()));
        if(!draft.quoteHash().equals(request.getQuoteHash()))throw new BadRequestException("Giá hoặc ưu đãi đã thay đổi. Hãy tính lại đơn.");
        var orders=new java.util.ArrayList<OrderResponse>();int index=0;
        for(var group:draft.groups()){
            CreateOrderRequest part=new CreateOrderRequest();part.setAddressId(request.getAddressId());part.setPaymentMethod(request.getPaymentMethod());part.setNote(request.getNote());part.setCartItemIds(group.cartItemIds());part.setSkuId(group.skuId());part.setQuantity(group.quantity());part.setAutoBest(false);part.setVoucherCodes(group.quote().applied().stream().map(a->a.code()).toList());part.setExcluded(group.excluded());part.setQuoteHash(group.quote().quoteHash());part.setIdempotencyKey(request.getIdempotencyKey()+"_"+index++);part.setBatchInternal(true);orders.add(createOrder(user,part));
        }return orders;
    }

    public OrderResponse createOrder(Long userId, CreateOrderRequest request) {
        String method=java.util.Objects.toString(request.getPaymentMethod(),"").trim().toUpperCase(java.util.Locale.ROOT);
        if(!java.util.Set.of("COD","VISA","DOMESTIC").contains(method))throw new BadRequestException("Phương thức thanh toán không được hỗ trợ");
        request.setPaymentMethod(method);
        if(request.getSkuId()!=null)jdbc.update("INSERT IGNORE INTO carts(user_id) VALUES(?)",userId);
        Cart cart = cartRepository.findByUserIdForUpdate(userId)
                .orElseThrow(() -> new BadRequestException("Cart is empty"));

        String key=userId+":"+request.getIdempotencyKey();
        var previous=orderRepository.findByIdempotencyKey(key);
        if(previous.isPresent())return OrderResponse.from(previous.get(),null);
        if(!request.isBatchInternal())promotionEvents.throttle(userId);
        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
        if(request.getCartItemIds()!=null)cartItems=cartItems.stream().filter(i->request.getCartItemIds().contains(i.getId())).toList();
        if (cartItems.isEmpty() && request.getSkuId()==null) {
            throw new BadRequestException("Cart is empty");
        }

        if(request.getSkuId()==null)shops.requireSingleShop(cartItems);

        AddressInternalDTO address = authInternalService.getAddressByIdAndUserId(request.getAddressId(), userId);

        java.util.List<String> codes=request.getVoucherCodes();
        if((codes==null||codes.isEmpty())&&request.getVoucherCode()!=null&&!request.getVoucherCode().isBlank())codes=List.of(request.getVoucherCode());
        var quote=promotions.quote(userId,new com.team.ecommerce.order.promotion.PromotionModels.QuoteInput(codes,request.getAutoBest(),request.getCartItemIds(),request.getSkuId(),request.getQuantity(),request.getExcluded(),null,null));
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
                .tax(tax).taxRate(quote.vatPercent().movePointLeft(2))
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
        finance.snapshot(order.getId(),quote);

        if(request.getSkuId()==null)for(var purchased:quote.lines())cartItemRepository.deleteById(purchased.cartItemId());

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
        return PageResponse.from(orderRepository.findShopOrders(userId,org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(),pageable.getPageSize())).map(o->OrderResponse.from(o,null)));
    }

    public java.util.Map<String,Object> returnDetails(Long userId,Long orderId){
        Order order=orderRepository.findById(orderId).orElseThrow(()->new ResourceNotFoundException("Order","id",orderId));
        if(!order.getUserId().equals(userId))throw new org.springframework.security.access.AccessDeniedException("Đơn không thuộc tài khoản.");
        var rows=jdbc.queryForList("SELECT status,description AS reason,resolved_at AS resolvedAt FROM order_returns WHERE order_id=? ORDER BY id",orderId);
        var refund=jdbc.queryForList("SELECT amount,transaction_reference AS reference,created_at AS createdAt FROM commerce_refunds WHERE order_id=?",orderId);
        return java.util.Map.of("steps",rows,"refund",refund,"orderStatus",order.getStatus().name());
    }
    public OrderResponse requestReturn(Long userId,Long orderId,String description){
        String reason=description==null?"":description.trim();
        if(reason.length()<10||reason.length()>1500)throw new BadRequestException("Nhập lý do trả hàng từ 10 đến 1.500 ký tự.");
        Order order=orderRepository.findForUpdate(orderId).orElseThrow(()->new ResourceNotFoundException("Order","id",orderId));
        if(!order.getUserId().equals(userId))throw new org.springframework.security.access.AccessDeniedException("Đơn không thuộc tài khoản.");
        if(order.getStatus()!=OrderStatus.DELIVERED)throw new BadRequestException("Chỉ yêu cầu trả hàng sau khi đã nhận đơn.");
        if(jdbc.queryForObject("SELECT COUNT(*) FROM order_returns WHERE order_id=?",Long.class,orderId)>0)throw new BadRequestException("Đơn đã có yêu cầu trả hàng. Vui lòng nhắn shop để được hỗ trợ tiếp.");
        for(OrderItem item:order.getItems())jdbc.update("INSERT INTO order_returns(order_id,order_item_id,user_id,reason,description,status) VALUES(?,?,?,'OTHER',?,'REQUESTED')",orderId,item.getId(),userId,reason);
        return updateOrderStatus(orderId,OrderStatus.RETURNED);
    }
    public OrderResponse transition(Long userId, Long orderId, OrderStatus target) {
        if(target==OrderStatus.RETURNED)throw new BadRequestException("Vui lòng nhập lý do trả hàng.");
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
            order.setPaymentStatus("PAID");
            order.setPaidAt(java.time.LocalDateTime.now());
        }
        boolean newlyDelivered = status == OrderStatus.DELIVERED && order.getStatus() != OrderStatus.DELIVERED;
        if(status==OrderStatus.SHIPPING)order.setShippedAt(java.time.LocalDateTime.now());
        if(newlyDelivered){
            order.setDeliveredAt(java.time.LocalDateTime.now());
            if("COD".equals(order.getPaymentMethod())){order.setPaymentStatus("PAID");order.setPaidAt(java.time.LocalDateTime.now());}
        }
        order.setStatus(status);
        order = orderRepository.save(order);
        shops.notifyBuyer(order);
        promotionEvents.enqueue("ORDER_STATUS_CHANGED",java.util.Map.of("orderId",orderId,"status",status.name()));
        if (newlyDelivered) {
            for (OrderItem item : order.getItems()) {
                jdbc.update("UPDATE product_db.products SET sold_count=sold_count+? WHERE id=?", item.getQuantity(), item.getProductId());
                if (item.getVariantId() != null) jdbc.update("UPDATE product_db.product_skus SET sold_count=sold_count+?,version=COALESCE(version,0)+1 WHERE id=? AND product_id=?", item.getQuantity(), item.getVariantId(), item.getProductId());
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
