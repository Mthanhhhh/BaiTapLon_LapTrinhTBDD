package com.team.ecommerce.auth.controller;

import com.team.ecommerce.auth.dto.AddressRequest;
import com.team.ecommerce.auth.dto.AddressResponse;
import com.team.ecommerce.auth.service.AddressService;
import com.team.ecommerce.auth.service.AuthService;
import com.team.ecommerce.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;
    private final AuthService authService;

    @GetMapping
    public ApiResponse<List<AddressResponse>> getAddresses() {
        return ApiResponse.success(addressService.getAddresses(authService.getCurrentUserId()));
    }

    @PostMapping
    public ApiResponse<AddressResponse> addAddress(@Valid @RequestBody AddressRequest request) {
        return ApiResponse.success("Address added", addressService.addAddress(authService.getCurrentUserId(), request));
    }

    @PutMapping("/{id}")
    public ApiResponse<AddressResponse> updateAddress(@PathVariable Long id, @Valid @RequestBody AddressRequest request) {
        return ApiResponse.success("Address updated", addressService.updateAddress(authService.getCurrentUserId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteAddress(@PathVariable Long id) {
        addressService.deleteAddress(authService.getCurrentUserId(), id);
        return ApiResponse.success("Address deleted", null);
    }

    @PatchMapping("/{id}/default")
    public ApiResponse<AddressResponse> setDefaultAddress(@PathVariable Long id) {
        return ApiResponse.success("Default address set", addressService.setDefaultAddress(authService.getCurrentUserId(), id));
    }
}
