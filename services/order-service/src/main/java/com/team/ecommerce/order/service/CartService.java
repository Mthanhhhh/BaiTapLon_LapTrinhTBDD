package com.team.ecommerce.order.service;

import com.team.ecommerce.order.dto.AddToCartRequest;
import com.team.ecommerce.order.dto.CartItemResponse;
import com.team.ecommerce.order.dto.CartResponse;
import com.team.ecommerce.order.dto.UpdateCartItemRequest;
import com.team.ecommerce.order.entity.Cart;
import com.team.ecommerce.order.entity.CartItem;
import com.team.ecommerce.order.repository.CartItemRepository;
import com.team.ecommerce.order.repository.CartRepository;
import com.team.ecommerce.product.internal.ProductInternalDTO;
import com.team.ecommerce.product.internal.ProductInternalService;
import com.team.ecommerce.product.internal.VariantInternalDTO;
import com.team.ecommerce.shared.exception.BadRequestException;
import com.team.ecommerce.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpClientErrorException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional("orderTransactionManager")
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductInternalService productInternalService;

    public CartResponse getCart(Long userId) {
        Cart cart = cartRepository.findByUserId(userId).orElseGet(() -> {
            Cart newCart = Cart.builder().userId(userId).build();
            return cartRepository.save(newCart);
        });
        return buildCartResponse(cart);
    }

    public CartResponse addToCart(Long userId, AddToCartRequest request) {
        Cart cart = cartRepository.findByUserId(userId).orElseGet(() -> {
            Cart newCart = Cart.builder().userId(userId).build();
            return cartRepository.save(newCart);
        });

        ProductInternalDTO product = productInternalService.getProductById(request.getProductId());

        if (!product.isActive()) {
            throw new BadRequestException("Product is not active");
        }

        VariantInternalDTO variant = null;
        int availableStock = product.getStock();

        if (request.getVariantId() != null) {
            variant = product.getVariants().stream()
                    .filter(v -> v.getId().equals(request.getVariantId()))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", "id", request.getVariantId()));
            availableStock = variant.getStock();
        } else {
            throw new BadRequestException("A product SKU must be selected before adding it to the cart");
        }

        Optional<CartItem> existingItemOpt = cartItemRepository.findByCartIdAndProductIdAndVariantId(
                cart.getId(), product.getId(), request.getVariantId());

        if (existingItemOpt.isPresent()) {
            CartItem existingItem = existingItemOpt.get();
            int newQuantity = existingItem.getQuantity() + request.getQuantity();
            if (newQuantity > availableStock) {
                throw new BadRequestException("Not enough stock available");
            }
            existingItem.setQuantity(newQuantity);
            cartItemRepository.save(existingItem);
        } else {
            if (request.getQuantity() > availableStock) {
                throw new BadRequestException("Not enough stock available");
            }
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .shopId(product.getShopId())
                    .productId(product.getId())
                    .variantId(request.getVariantId())
                    .addedPrice(variant.getPrice())
                    .quantity(request.getQuantity())
                    .build();
            cartItemRepository.save(newItem);
        }

        return buildCartResponse(cart);
    }

    public CartResponse updateCartItem(Long userId, Long cartItemId, UpdateCartItemRequest request) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "userId", userId));

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", cartItemId));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("CartItem does not belong to your cart");
        }

        ProductInternalDTO product = productInternalService.getProductById(cartItem.getProductId());

        int availableStock = product.getStock();
        if (cartItem.getVariantId() != null) {
            VariantInternalDTO variant = product.getVariants().stream()
                    .filter(v -> v.getId().equals(cartItem.getVariantId()))
                    .findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", "id", cartItem.getVariantId()));
            availableStock = variant.getStock();
        }

        if (request.getQuantity() > availableStock) {
            throw new BadRequestException("Not enough stock available");
        }

        cartItem.setQuantity(request.getQuantity());
        cartItemRepository.save(cartItem);

        return buildCartResponse(cart);
    }

    public CartResponse removeCartItem(Long userId, Long cartItemId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "userId", userId));

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", cartItemId));

        if (!cartItem.getCart().getId().equals(cart.getId())) {
            throw new BadRequestException("CartItem does not belong to your cart");
        }

        cartItemRepository.delete(cartItem);
        return buildCartResponse(cart);
    }

    public void clearCart(Long userId) {
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart", "userId", userId));
        cartItemRepository.deleteAllByCartIdInBulk(cart.getId());
    }

    private CartResponse buildCartResponse(Cart cart) {
        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());
        List<CartItemResponse> itemResponses = new ArrayList<>();
        for (CartItem item : cartItems) {
            ProductInternalDTO product;
            try {
                product = productInternalService.getProductById(item.getProductId());
            } catch (HttpClientErrorException.NotFound missingProduct) {
                log.warn("Removing stale cart item {} for unavailable product {}", item.getId(), item.getProductId());
                cartItemRepository.delete(item);
                continue;
            }

            VariantInternalDTO variant = product.getVariants().stream()
                    .filter(v -> v.getId().equals(item.getVariantId()))
                    .findFirst()
                    .orElse(null);
            if (variant == null) {
                log.warn("Removing stale cart item {} for unavailable SKU {}", item.getId(), item.getVariantId());
                cartItemRepository.delete(item);
                continue;
            }

            itemResponses.add(CartItemResponse.builder()
                    .id(item.getId())
                    .productId(product.getId())
                    .variantId(variant.getId())
                    .productName(product.getName())
                    .variantName(variant.getName())
                    .price(variant.getPrice())
                    .quantity(item.getQuantity())
                    .subtotal(variant.getPrice().multiply(java.math.BigDecimal.valueOf(item.getQuantity())))
                    .productImage(product.getThumbnailUrl())
                    .build());
        }

        return CartResponse.from(cart, itemResponses);
    }
}
