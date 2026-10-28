package com.team.ecommerce.auth.controller;

import com.team.ecommerce.auth.internal.AddressInternalDTO;
import com.team.ecommerce.auth.internal.AuthInternalService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/addresses")
@RequiredArgsConstructor
public class InternalAddressController {

    private final AuthInternalService authInternalService;

    @GetMapping("/{id}")
    public AddressInternalDTO getAddressByIdAndUserId(
            @PathVariable("id") Long id,
            @RequestParam("userId") Long userId) {
        return authInternalService.getAddressByIdAndUserId(id, userId);
    }
}

