package com.team.ecommerce.product.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.team.ecommerce.product.dto.AiChatRequest;
import com.team.ecommerce.product.dto.AiChatResponse;
import com.team.ecommerce.product.dto.ProductListResponse;
import com.team.ecommerce.product.dto.ProductSearchRequest;
import com.team.ecommerce.shared.dto.PageResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AiShoppingService {
    private final ProductService productService;
    private final ObjectMapper mapper;
    private final String apiKey;
    private final String model;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    public AiShoppingService(ProductService productService, ObjectMapper mapper,
            @Value("${app.ai.openai.api-key:}") String apiKey,
            @Value("${app.ai.openai.model:gpt-6-astra}") String model) {
        this.productService = productService;
        this.mapper = mapper;
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model;
    }

    public AiChatResponse chat(AiChatRequest request) {
        String message = request.getMessage().trim();
        ProductSearchRequest search = new ProductSearchRequest();
        search.setKeyword(message);
        PageResponse<ProductListResponse> page = productService.searchProducts(search, PageRequest.of(0, 5));
        List<ProductListResponse> products = page.getContent();
        Answer answer = generateAnswer(message, request, products);
        return AiChatResponse.builder().answer(answer.text()).products(products).aiPowered(answer.aiPowered()).build();
    }

    private Answer generateAnswer(String message, AiChatRequest request, List<ProductListResponse> products) {
        if (apiKey.isBlank()) return new Answer(fallback(message, products), false);
        try {
            String catalog = products.stream().map(p -> String.format("id=%s | %s | giá %s VND | danh mục %s | tồn %s",
                    p.getId(), p.getName(), p.getPrice(), p.getCategoryName(), p.getStock())).collect(Collectors.joining("\n"));
            ObjectNode body = mapper.createObjectNode();
            body.put("model", model);
            body.put("store", false);
            body.put("max_output_tokens", 350);
            body.put("instructions", "Bạn là trợ lý mua sắm của E-Shop, trả lời bằng tiếng Việt, thân thiện và ngắn gọn. " +
                    "Chỉ tư vấn dựa trên catalog được cung cấp; không tự bịa giá, tồn kho, thông số hoặc khuyến mãi. " +
                    "Nếu không có sản phẩm phù hợp, hãy nói rõ và hỏi thêm nhu cầu. Không khẳng định đã đặt hàng hay thay đổi dữ liệu.");
            ArrayNode input = body.putArray("input");
            if (request.getHistory() != null) request.getHistory().stream().filter(t -> t.getRole() != null && t.getContent() != null)
                    .filter(t -> t.getRole().equals("user") || t.getRole().equals("assistant"))
                    .skip(Math.max(0, request.getHistory().size() - 8L)).forEach(t -> {
                        ObjectNode turn = input.addObject(); turn.put("role", t.getRole()); turn.put("content", t.getContent().substring(0, Math.min(1000, t.getContent().length())));
                    });
            input.addObject().put("role", "user").put("content", "Sản phẩm trong catalog:\n" + (catalog.isBlank() ? "Không có kết quả phù hợp." : catalog) + "\n\nCâu hỏi: " + message);
            HttpRequest httpRequest = HttpRequest.newBuilder(URI.create("https://api.openai.com/v1/responses"))
                    .timeout(Duration.ofSeconds(20)).header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body))).build();
            HttpResponse<String> response = http.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("AI provider returned HTTP {}", response.statusCode());
                return new Answer(fallback(message, products), false);
            }
            JsonNode output = mapper.readTree(response.body()).path("output");
            StringBuilder text = new StringBuilder();
            output.forEach(item -> item.path("content").forEach(part -> {
                if ("output_text".equals(part.path("type").asText())) text.append(part.path("text").asText());
            }));
            return text.isEmpty() ? new Answer(fallback(message, products), false) : new Answer(text.toString().trim(), true);
        } catch (Exception e) {
            log.warn("AI provider unavailable; using catalog fallback: {}", e.getClass().getSimpleName());
            return new Answer(fallback(message, products), false);
        }
    }

    private record Answer(String text, boolean aiPowered) {}

    private String fallback(String message, List<ProductListResponse> products) {
        if (products.isEmpty()) return "Mình chưa tìm thấy sản phẩm phù hợp với “" + message + "”. Bạn thử cho mình biết loại sản phẩm, thương hiệu hoặc khoảng giá nhé.";
        String names = products.stream().limit(3).map(p -> p.getName() + " (" + p.getPrice().toPlainString() + "₫)").collect(Collectors.joining("; "));
        return "Mình tìm được một số sản phẩm phù hợp: " + names + ". Chạm vào sản phẩm bên dưới để xem chi tiết. Bạn muốn ưu tiên giá, thương hiệu hay tính năng nào?";
    }
}
