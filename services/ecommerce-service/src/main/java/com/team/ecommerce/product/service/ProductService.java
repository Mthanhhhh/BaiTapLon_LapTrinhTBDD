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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional("productTransactionManager")
public class ProductService {
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ObjectMapper mapper = new ObjectMapper();

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

    public ProductResponse createProduct(CreateProductRequest request) {
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

        Product product = Product.builder()
                .name(request.getName())
                .slug(request.getName().toLowerCase().replaceAll("\\s+", "-"))
                .shopId(1L) // default shop
                .description(request.getDescription())
                .minPrice(request.getPrice())
                .maxPrice(request.getPrice())
                .originalPrice(request.getOriginalPrice())
                .categoryId(request.getCategoryId())
                .thumbnailUrl(request.getThumbnailUrl())
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
        return ProductResponse.from(savedProduct, getCategoryName(savedProduct.getCategoryId()));
    }

    public ProductResponse updateProduct(Long id, UpdateProductRequest request) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

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
        }
        if (request.getOriginalPrice() != null) product.setOriginalPrice(request.getOriginalPrice());
        if (request.getThumbnailUrl() != null) product.setThumbnailUrl(request.getThumbnailUrl());
        if (request.getAttributes() != null) product.setAttributes(request.getAttributes());

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
        return ProductResponse.from(savedProduct, getCategoryName(savedProduct.getCategoryId()));
    }

    public void deleteProduct(Long id) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        product.setDeletedAt(java.time.LocalDateTime.now());
        productRepository.save(product);
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
