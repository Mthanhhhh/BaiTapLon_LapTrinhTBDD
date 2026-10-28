package com.team.ecommerce.auth.internal;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Slf4j
@Service
public class AuthInternalService {

    private final RestClient restClient;

    public AuthInternalService(@Value("${services.auth.url:http://localhost:8083}") String authServiceUrl) {
        this.restClient = RestClient.builder().baseUrl(authServiceUrl).build();
    }

    public AddressInternalDTO getAddressByIdAndUserId(Long addressId, Long userId) {
        log.info("Calling auth-service for addressId={}, userId={}", addressId, userId);
        return restClient.get()
                .uri("/internal/addresses/{id}?userId={userId}", addressId, userId)
                .retrieve()
                .body(AddressInternalDTO.class);
    }
}

