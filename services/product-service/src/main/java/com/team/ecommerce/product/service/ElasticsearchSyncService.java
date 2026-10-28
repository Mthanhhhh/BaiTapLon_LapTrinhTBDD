package com.team.ecommerce.product.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.ecommerce.product.entity.Category;
import com.team.ecommerce.product.entity.Product;
import com.team.ecommerce.product.entity.ProductStatus;
import com.team.ecommerce.product.repository.CategoryRepository;
import com.team.ecommerce.product.repository.ProductRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ElasticsearchSyncService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${elasticsearch.url:http://127.0.0.1:9200}")
    private String elasticUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();

    @PostConstruct
    public void initAndSyncAll() {
        // Run in background daemon thread to avoid blocking application startup
        Thread syncThread = new Thread(() -> {
            try {
                Thread.sleep(3000); // Wait for service and docker to stabilize
                log.info("[Elasticsearch] Checking connection to {}...", elasticUrl);
                if (!isElasticsearchReachable()) {
                    log.warn("[Elasticsearch] Not reachable at {}. Real-time sync will be retried on write operations.", elasticUrl);
                    return;
                }

                ensureIndexExists();
                bulkSyncAllProducts();
            } catch (Exception e) {
                log.warn("[Elasticsearch] Initial sync encountered an issue: {}", e.getMessage());
            }
        });
        syncThread.setDaemon(true);
        syncThread.setName("es-sync-worker");
        syncThread.start();
    }

    public boolean isElasticsearchReachable() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(elasticUrl))
                    .timeout(Duration.ofSeconds(2))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }

    public void ensureIndexExists() {
        try {
            HttpRequest checkReq = HttpRequest.newBuilder()
                    .uri(URI.create(elasticUrl + "/products"))
                    .timeout(Duration.ofSeconds(2))
                    .method("HEAD", HttpRequest.BodyPublishers.noBody())
                    .build();
            HttpResponse<Void> checkRes = httpClient.send(checkReq, HttpResponse.BodyHandlers.discarding());

            if (checkRes.statusCode() == 404) {
                log.info("[Elasticsearch] Creating index 'products' with fuzzy search mappings...");
                String mappingJson = """
                {
                  "mappings": {
                    "properties": {
                      "id": { "type": "long" },
                      "name": { "type": "text", "analyzer": "standard", "fields": { "keyword": { "type": "keyword" } } },
                      "description": { "type": "text" },
                      "categoryName": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
                      "categoryId": { "type": "long" },
                      "price": { "type": "double" },
                      "originalPrice": { "type": "double" },
                      "rating": { "type": "double" },
                      "soldCount": { "type": "integer" },
                      "thumbnailUrl": { "type": "keyword" },
                      "shopLocation": { "type": "keyword" },
                      "status": { "type": "keyword" }
                    }
                  }
                }
                """;
                HttpRequest createReq = HttpRequest.newBuilder()
                        .uri(URI.create(elasticUrl + "/products"))
                        .header("Content-Type", "application/json")
                        .PUT(HttpRequest.BodyPublishers.ofString(mappingJson))
                        .build();
                httpClient.send(createReq, HttpResponse.BodyHandlers.ofString());
                log.info("[Elasticsearch] Index 'products' created successfully.");
            }
        } catch (Exception e) {
            log.error("[Elasticsearch] Error ensuring index exists: {}", e.getMessage());
        }
    }

    public void bulkSyncAllProducts() {
        try {
            List<Product> products = productRepository.findAll();
            int count = 0;
            for (Product p : products) {
                if (p.getDeletedAt() == null && p.getStatus() == ProductStatus.ACTIVE) {
                    syncProduct(p);
                    count++;
                }
            }
            // Refresh index
            HttpRequest refreshReq = HttpRequest.newBuilder()
                    .uri(URI.create(elasticUrl + "/products/_refresh"))
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .build();
            httpClient.send(refreshReq, HttpResponse.BodyHandlers.discarding());
            log.info("[Elasticsearch] Synced {} active products into Elasticsearch index 'products' successfully!", count);
        } catch (Exception e) {
            log.error("[Elasticsearch] Error during bulk sync: {}", e.getMessage());
        }
    }

    public void syncProduct(Product product) {
        try {
            String categoryName = null;
            if (product.getCategoryId() != null) {
                categoryName = categoryRepository.findById(product.getCategoryId())
                        .map(Category::getName).orElse(null);
            }

            Map<String, Object> doc = new HashMap<>();
            doc.put("id", product.getId());
            doc.put("name", product.getName());
            doc.put("description", product.getDescription() != null ? product.getDescription() : "");
            doc.put("categoryName", categoryName != null ? categoryName : "");
            doc.put("categoryId", product.getCategoryId());
            doc.put("price", product.getMinPrice() != null ? product.getMinPrice().doubleValue() : 0.0);
            doc.put("originalPrice", product.getOriginalPrice() != null ? product.getOriginalPrice().doubleValue() : 0.0);
            doc.put("rating", product.getRatingAvg() != null ? product.getRatingAvg().doubleValue() : 5.0);
            doc.put("soldCount", product.getSoldCount());
            doc.put("thumbnailUrl", product.getThumbnailUrl() != null ? product.getThumbnailUrl() : "");
            doc.put("status", product.getStatus() != null ? product.getStatus().name() : "ACTIVE");

            String json = mapper.writeValueAsString(doc);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(elasticUrl + "/products/_doc/" + product.getId()))
                    .header("Content-Type", "application/json")
                    .PUT(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            httpClient.sendAsync(request, HttpResponse.BodyHandlers.discarding());
            log.debug("[Elasticsearch] Real-time synced product ID {}", product.getId());
        } catch (Exception e) {
            log.warn("[Elasticsearch] Failed to sync product ID {}: {}", product.getId(), e.getMessage());
        }
    }

    public void deleteProduct(Long productId) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(elasticUrl + "/products/_doc/" + productId))
                    .DELETE()
                    .build();
            httpClient.sendAsync(request, HttpResponse.BodyHandlers.discarding());
            log.info("[Elasticsearch] Real-time deleted product ID {} from index", productId);
        } catch (Exception e) {
            log.warn("[Elasticsearch] Failed to delete product ID {}: {}", productId, e.getMessage());
        }
    }

    public List<Long> searchProductIds(String keyword, Long categoryId, Double minPrice, Double maxPrice, int size) {
        List<Long> ids = new ArrayList<>();
        if (keyword == null || keyword.trim().isEmpty()) {
            return ids;
        }

        try {
            List<Map<String, Object>> mustClauses = new ArrayList<>();
            Map<String, Object> multiMatch = new HashMap<>();
            multiMatch.put("query", keyword.trim());
            multiMatch.put("fields", List.of("name^4", "categoryName^2", "description"));
            multiMatch.put("fuzziness", "AUTO");
            multiMatch.put("prefix_length", 1);
            mustClauses.add(Map.of("multi_match", multiMatch));

            List<Map<String, Object>> filterClauses = new ArrayList<>();

            if (categoryId != null) {
                filterClauses.add(Map.of("term", Map.of("categoryId", categoryId)));
            }

            if (minPrice != null || maxPrice != null) {
                Map<String, Object> rangeParams = new HashMap<>();
                if (minPrice != null) rangeParams.put("gte", minPrice);
                if (maxPrice != null) rangeParams.put("lte", maxPrice);
                filterClauses.add(Map.of("range", Map.of("price", rangeParams)));
            }

            Map<String, Object> queryMap = new HashMap<>();
            if (filterClauses.isEmpty()) {
                queryMap.put("multi_match", multiMatch);
            } else {
                Map<String, Object> boolQuery = new HashMap<>();
                boolQuery.put("must", List.of(Map.of("multi_match", multiMatch)));
                boolQuery.put("filter", filterClauses);
                queryMap.put("bool", boolQuery);
            }

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("size", Math.max(10, size));
            requestBody.put("query", queryMap);

            String queryJson = mapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(elasticUrl + "/products/_search"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(queryJson))
                    .timeout(Duration.ofSeconds(3))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = mapper.readTree(response.body());
                JsonNode hits = root.path("hits").path("hits");
                if (hits.isArray()) {
                    for (JsonNode hit : hits) {
                        long id = hit.path("_source").path("id").asLong();
                        if (id > 0) {
                            ids.add(id);
                        }
                    }
                }
                log.info("[Elasticsearch] Fuzzy search for '{}' returned {} hits", keyword, ids.size());
            }
        } catch (Exception e) {
            log.warn("[Elasticsearch] Search query failed, will fall back to DB: {}", e.getMessage());
        }

        return ids;
    }
}
