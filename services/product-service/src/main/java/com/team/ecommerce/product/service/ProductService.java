package com.team.ecommerce.product.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.team.ecommerce.product.dto.*;
import com.team.ecommerce.product.entity.Category;
import com.team.ecommerce.product.entity.Product;
import com.team.ecommerce.product.entity.ProductStatus;
import com.team.ecommerce.product.entity.ProductVariant;
import com.team.ecommerce.product.repository.CategoryRepository;
import com.team.ecommerce.product.repository.ProductRepository;
import com.team.ecommerce.product.repository.ProductVariantRepository;
import com.team.ecommerce.shared.dto.PageResponse;
import com.team.ecommerce.shared.exception.BadRequestException;
import com.team.ecommerce.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional("productTransactionManager")
public class ProductService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ElasticsearchSyncService elasticsearchSyncService;
    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper = new ObjectMapper();

    public PageResponse<ProductListResponse> recommendations(String keyword,int page,int size) {
        // The keyword ranks the full active catalog; it must never filter out other products.
        var paging=org.springframework.data.domain.PageRequest.of(Math.max(0,page),Math.max(1,Math.min(size,50)));
        String term=keyword == null ? "" : keyword.trim().toLowerCase(java.util.Locale.ROOT);
        var result=productRepository.findAll((root,query,cb)->{
            var active=cb.and(cb.equal(root.get("status"),ProductStatus.ACTIVE),cb.isNull(root.get("deletedAt")));
            if (query != null && query.getResultType() != Long.class && query.getResultType() != long.class) {
                var ranking=new java.util.ArrayList<jakarta.persistence.criteria.Order>();
                if (!term.isEmpty()) {
                    String pattern="%"+term.replace("\\","\\\\").replace("%","\\%").replace("_","\\_")+"%";
                    var related=cb.like(cb.lower(root.<String>get("name")),pattern,'\\');
                    ranking.add(cb.desc(cb.<Integer>selectCase().when(related,1).otherwise(0)));
                }
                ranking.add(cb.desc(root.get("ratingAvg")));
                ranking.add(cb.desc(root.get("ratingCount")));
                ranking.add(cb.desc(root.get("soldCount")));
                ranking.add(cb.desc(root.get("id")));
                query.orderBy(ranking);
            }
            return active;
        },paging);
        return mapToPageResponse(result);
    }

    @Transactional(value = "productTransactionManager", readOnly = true)
    public PageResponse<ProductListResponse> getProducts(Pageable pageable) {
        Page<Product> page = productRepository.findByDeletedAtIsNullAndStatus(ProductStatus.ACTIVE, pageable);
        return mapToPageResponse(page);
    }

    @Transactional(value = "productTransactionManager", readOnly = true)
    public PageResponse<ProductListResponse> getProductsByCategory(Long categoryId, Pageable pageable) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));

        Set<Long> categoryIds = new LinkedHashSet<>();
        categoryIds.add(categoryId);
        String path = category.getPath();
        if (path != null && !path.trim().isEmpty() && !path.trim().equals("/")) {
            List<Category> descendants = categoryRepository.findByPathStartingWith(path);
            for (Category descendant : descendants) {
                categoryIds.add(descendant.getId());
            }
        }

        Page<Product> page = productRepository.findByCategoryIdInAndDeletedAtIsNullAndStatus(categoryIds, ProductStatus.ACTIVE, pageable);
        return mapToPageResponse(page);
    }

    @Transactional(value = "productTransactionManager", readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        String categoryName = getCategoryName(product.getCategoryId());
        return ProductResponse.from(product, categoryName);
    }

    @Transactional(value = "productTransactionManager", readOnly = true)
    public PageResponse<ProductListResponse> searchProducts(ProductSearchRequest request, Pageable pageable) {
        if (request.getKeyword() != null && !request.getKeyword().trim().isEmpty()) {
            Double minP = request.getMinPrice() != null ? request.getMinPrice().doubleValue() : null;
            Double maxP = request.getMaxPrice() != null ? request.getMaxPrice().doubleValue() : null;
            List<Long> esIds = elasticsearchSyncService.searchProductIds(request.getKeyword(), request.getCategoryId(), minP, maxP, 50);

            if (!esIds.isEmpty()) {
                List<Product> matched = productRepository.findAllById(esIds);
                // Keep the relevance score order returned by Elasticsearch
                Map<Long, Product> productMap = new HashMap<>();
                for (Product p : matched) {
                    if (p.getDeletedAt() == null && p.getStatus() == ProductStatus.ACTIVE) {
                        productMap.put(p.getId(), p);
                    }
                }
                List<ProductListResponse> sortedList = new ArrayList<>();
                for (Long id : esIds) {
                    Product p = productMap.get(id);
                    if (p != null) {
                        sortedList.add(ProductListResponse.from(p, getCategoryName(p.getCategoryId())));
                    }
                }
                if (!sortedList.isEmpty()) {
                    return PageResponse.<ProductListResponse>builder()
                            .content(sortedList)
                            .page(0)
                            .size(sortedList.size())
                            .totalElements((long) sortedList.size())
                            .totalPages(1)
                            .last(true)
                            .build();
                }
            }
        }

        // Fallback to MySQL JPA Specification
        Page<Product> page = productRepository.findAll(
                ProductSpecification.search(
                        request.getKeyword(),
                        request.getCategoryId(),
                        request.getMinPrice(),
                        request.getMaxPrice(),
                        request.getMinRating()
                ),
                pageable
        );
        return mapToPageResponse(page);
    }

    @Transactional(value = "productTransactionManager", readOnly = true)
    public PageResponse<ProductListResponse> getBestSales(Pageable pageable) {
        Page<Product> page = productRepository.findByDeletedAtIsNullAndStatusAndSoldCountGreaterThanOrderBySoldCountDesc(ProductStatus.ACTIVE, 0, pageable);
        return mapToPageResponse(page);
    }

    @Transactional(value = "productTransactionManager", readOnly = true)
    public PageResponse<ProductListResponse> getPopular(Pageable pageable) {
        Page<Product> page = productRepository.findByDeletedAtIsNullAndStatusOrderByRatingAvgDesc(ProductStatus.ACTIVE, pageable);
        return mapToPageResponse(page);
    }

    private void requireShopOwner(Long shopId, Long userId) {
        Integer ownsShop = jdbc.queryForObject("SELECT COUNT(*) FROM product_db.shops WHERE id=? AND owner_user_id=? AND deleted_at IS NULL", Integer.class, shopId, userId);
        if (ownsShop == null || ownsShop == 0) throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền quản lý shop này");
    }

    public ProductResponse createProduct(CreateProductRequest request, Long userId) {
        if (!categoryRepository.existsById(request.getCategoryId())) {
            throw new ResourceNotFoundException("Category", "id", request.getCategoryId());
        }

        List<com.team.ecommerce.product.entity.ProductImage> images = new ArrayList<>();
        if (request.getImages() != null) {
            for (int i = 0; i < request.getImages().size(); i++) {
                images.add(com.team.ecommerce.product.entity.ProductImage.builder()
                        .url(request.getImages().get(i))
                        .sortOrder(i)
                        .build());
            }
        }

        Long sId = request.getShopId() != null ? request.getShopId() : 1L;
        requireShopOwner(sId, userId);
        Product product = Product.builder()
                .name(request.getName())
                .slug(request.getName().toLowerCase().replaceAll("\\s+", "-") + "-" + System.currentTimeMillis())
                .shopId(sId)
                .description(request.getDescription())
                .minPrice(request.getPrice())
                .maxPrice(request.getPrice())
                .originalPrice(request.getOriginalPrice())
                .categoryId(request.getCategoryId())
                .thumbnailUrl(request.getThumbnailUrl())
                .currency("VND")
                .images(images)
                .attributes(request.getAttributes())
                .build();

        if (request.getVariants() != null && !request.getVariants().isEmpty()) {
            List<ProductVariant> variants = new ArrayList<>();
            for (ProductVariantRequest vr : request.getVariants()) {
                ProductVariant variant = ProductVariant.builder()
                        .product(product)
                        .name(vr.getName())
                        .sku(vr.getSku())
                        .price(vr.getPrice())
                        .stock(vr.getStock())
                        .build();
                variants.add(variant);
            }
            product.setVariants(variants);
        }

        Product savedProduct = productRepository.save(product);
        elasticsearchSyncService.syncProduct(savedProduct);
        return ProductResponse.from(savedProduct, getCategoryName(savedProduct.getCategoryId()));
    }

    @CacheEvict(value = "products", key = "'id:' + #id")
    public ProductResponse updateProduct(Long id, UpdateProductRequest request, Long userId) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        requireShopOwner(product.getShopId(), userId);

        if (request.getCategoryId() != null) {
            if (!categoryRepository.existsById(request.getCategoryId())) {
                throw new ResourceNotFoundException("Category", "id", request.getCategoryId());
            }
            product.setCategoryId(request.getCategoryId());
        }

        if (request.getName() != null) {
            product.setName(request.getName());
            product.setSlug(request.getName().toLowerCase().replaceAll("\\s+", "-"));
        }
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getPrice() != null) {
            product.setMinPrice(request.getPrice());
            product.setMaxPrice(request.getPrice());
            // Product cards use products.min_price while detail/cart use SKU prices.
            // Keep both representations in sync when the seller edits a single product price.
            List<ProductVariant> variants = productVariantRepository.findByProductId(id);
            variants.forEach(variant -> variant.setPrice(request.getPrice()));
        }
        if (request.getOriginalPrice() != null) {
            product.setOriginalPrice(request.getOriginalPrice());
            productVariantRepository.findByProductId(id).forEach(variant -> variant.setOriginalPrice(request.getOriginalPrice()));
        }
        if (request.getThumbnailUrl() != null) product.setThumbnailUrl(request.getThumbnailUrl());
        if (request.getAttributes() != null) product.setAttributes(request.getAttributes());

        if (request.getStock() != null) {
            List<ProductVariant> variants = productVariantRepository.findByProductId(id);
            // The legacy edit form has one stock field; only apply it when the product
            // has one SKU, so a total stock value is not copied to every variation.
            if (variants.size() == 1) variants.get(0).setStock(request.getStock());
        }

        if (request.getImages() != null) {
            product.getImages().clear();
            for (int i = 0; i < request.getImages().size(); i++) {
                product.getImages().add(com.team.ecommerce.product.entity.ProductImage.builder()
                        .url(request.getImages().get(i))
                        .sortOrder(i)
                        .build());
            }
        }

        if (request.getVariants() != null) {
            product.getVariants().clear();
            for (ProductVariantRequest vr : request.getVariants()) {
                ProductVariant variant = ProductVariant.builder()
                        .product(product)
                        .name(vr.getName())
                        .sku(vr.getSku())
                        .price(vr.getPrice())
                        .stock(vr.getStock())
                        .build();
                product.getVariants().add(variant);
            }
        }

        Product savedProduct = productRepository.save(product);
        elasticsearchSyncService.syncProduct(savedProduct);
        return ProductResponse.from(savedProduct, getCategoryName(savedProduct.getCategoryId()));
    }

    @CacheEvict(value = "products", key = "'id:' + #id")
    public void deleteProduct(Long id, Long userId) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        requireShopOwner(product.getShopId(), userId);
        product.setDeletedAt(java.time.LocalDateTime.now());
        productRepository.save(product);
        elasticsearchSyncService.deleteProduct(id);
    }

    public void updateStock(Long productId, Long variantId, int quantity) {
        if (variantId != null) {
            ProductVariant variant = productVariantRepository.findById(variantId)
                    .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", "id", variantId));
            if (!variant.getProduct().getId().equals(productId)) {
                throw new BadRequestException("Variant does not belong to product");
            }
            if (variant.getStock() + quantity < 0) {
                throw new BadRequestException("Not enough stock for variant");
            }
            variant.setStock(variant.getStock() + quantity);
            productVariantRepository.save(variant);
        } else {
            throw new BadRequestException("Variant ID is required for stock updates");
        }
    }

    private String getCategoryName(Long categoryId) {
        if (categoryId == null) return null;
        return categoryRepository.findById(categoryId).map(Category::getName).orElse(null);
    }

    private PageResponse<ProductListResponse> mapToPageResponse(Page<Product> page) {
        Page<ProductListResponse> responsePage = page.map(p -> ProductListResponse.from(p, getCategoryName(p.getCategoryId())));
        return PageResponse.from(responsePage);
    }
}
