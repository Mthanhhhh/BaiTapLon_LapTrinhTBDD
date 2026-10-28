package com.team.ecommerce.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QrLoginResponse {
    private String qrToken;
    private String status; // PENDING, SCANNED, CONFIRMED
    private AuthResponse authResponse;
}

