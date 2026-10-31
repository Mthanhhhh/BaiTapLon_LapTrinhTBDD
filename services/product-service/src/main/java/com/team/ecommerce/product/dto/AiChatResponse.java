package com.team.ecommerce.product.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class AiChatResponse {
    private String answer;
    private List<ProductListResponse> products;
    private boolean aiPowered;
}
