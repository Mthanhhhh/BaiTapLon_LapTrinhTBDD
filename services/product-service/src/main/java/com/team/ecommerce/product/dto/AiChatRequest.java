package com.team.ecommerce.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

@Data
public class AiChatRequest {
    @NotBlank @Size(max = 500)
    private String message;
    @Size(max = 8)
    private List<ChatTurn> history;

    @Data
    public static class ChatTurn {
        @Size(max = 1000)
        private String role;
        @Size(max = 1000)
        private String content;
    }
}
