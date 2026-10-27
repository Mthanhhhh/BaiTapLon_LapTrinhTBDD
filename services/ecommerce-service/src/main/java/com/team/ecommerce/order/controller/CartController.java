package com.team.ecommerce.order.controller;

import com.team.ecommerce.auth.service.AuthService;
import com.team.ecommerce.order.dto.AddToCartRequest;
import com.team.ecommerce.order.dto.CartResponse;
import com.team.ecommerce.order.dto.UpdateCartItemRequest;
import com.team.ecommerce.order.service.CartService;
import com.team.ecommerce.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final AuthService authService;

    @GetMapping
    public ApiResponse<CartResponse> getCart() {
        return ApiResponse.success(cartService.getCart(authService.getCurrentUserId()));
    }

    @PostMapping("/items")
    public ApiResponse<CartResponse> addToCart(@Valid @RequestBody AddToCartRequest request) {
        return ApiResponse.success("Added to cart", cartService.addToCart(authService.getCurrentUserId(), request));
    }

    @PutMapping("/items/{itemId}")
    public ApiResponse<CartResponse> updateCartItem(@PathVariable Long itemId, @Valid @RequestBody UpdateCartItemRequest request) {
        return ApiResponse.success("Cart item updated", cartService.updateCartItem(authService.getCurrentUserId(), itemId, request));
    }

    @DeleteMapping("/items/{itemId}")
    public ApiResponse<CartResponse> removeCartItem(@PathVariable Long itemId) {
        return ApiResponse.success("Item removed from cart", cartService.removeCartItem(authService.getCurrentUserId(), itemId));
    }

    @DeleteMapping
    public ApiResponse<Void> clearCart() {
        cartService.clearCart(authService.getCurrentUserId());
        return ApiResponse.success("Cart cleared", null);
    }
}
