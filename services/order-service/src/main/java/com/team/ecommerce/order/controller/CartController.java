package com.team.ecommerce.order.controller;

import com.team.ecommerce.order.dto.AddToCartRequest;
import com.team.ecommerce.order.dto.CartResponse;
import com.team.ecommerce.order.dto.UpdateCartItemRequest;
import com.team.ecommerce.order.service.CartService;
import com.team.ecommerce.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ApiResponse<CartResponse> getCart(@AuthenticationPrincipal Long userId) {
        return ApiResponse.success(cartService.getCart(userId));
    }

    @PostMapping("/items")
    public ApiResponse<CartResponse> addToCart(@AuthenticationPrincipal Long userId, @Valid @RequestBody AddToCartRequest request) {
        return ApiResponse.success("Added to cart", cartService.addToCart(userId, request));
    }

    @PutMapping("/items/{itemId}")
    public ApiResponse<CartResponse> updateCartItem(@AuthenticationPrincipal Long userId, @PathVariable Long itemId, @Valid @RequestBody UpdateCartItemRequest request) {
        return ApiResponse.success("Cart item updated", cartService.updateCartItem(userId, itemId, request));
    }

    @DeleteMapping("/items/{itemId}")
    public ApiResponse<CartResponse> removeCartItem(@AuthenticationPrincipal Long userId, @PathVariable Long itemId) {
        return ApiResponse.success("Item removed from cart", cartService.removeCartItem(userId, itemId));
    }

    @DeleteMapping
    public ApiResponse<Void> clearCart(@AuthenticationPrincipal Long userId) {
        cartService.clearCart(userId);
        return ApiResponse.success("Cart cleared", null);
    }
}
