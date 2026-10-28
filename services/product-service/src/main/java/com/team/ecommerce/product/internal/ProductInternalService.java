package com.team.ecommerce.product.internal;

import com.team.ecommerce.product.entity.Product;
import com.team.ecommerce.product.entity.ProductVariant;
import com.team.ecommerce.product.repository.ProductRepository;
import com.team.ecommerce.product.repository.ProductVariantRepository;
import com.team.ecommerce.shared.exception.BadRequestException;
import com.team.ecommerce.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.CacheEvict;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductInternalService {
    
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;

    @Transactional(value = "productTransactionManager", readOnly = true)
    public ProductInternalDTO getProductById(Long productId) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
                
        return mapToDTO(product);
    }
    
    @Transactional(value = "productTransactionManager", readOnly = true)
    public VariantInternalDTO getVariantById(Long variantId) {
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", "id", variantId));
        return VariantInternalDTO.builder()
                .id(variant.getId())
                .name(variant.getName())
                .price(variant.getPrice())
                .stock(variant.getStock())
                .build();
    }

    @Transactional(value = "productTransactionManager", propagation = Propagation.REQUIRES_NEW)
    @CacheEvict(value = "products", key = "'id:' + #productId")
    public void deductStock(Long productId, Long variantId, int quantity) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        if (variantId != null) {
            ProductVariant variant = productVariantRepository.findById(variantId)
                    .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", "id", variantId));
            if (!variant.getProduct().getId().equals(productId)) {
                throw new BadRequestException("Variant does not belong to product");
            }
            if (variant.getStock() < quantity) {
                throw new BadRequestException("Not enough stock for variant: " + variant.getName());
            }
            variant.setStock(variant.getStock() - quantity);
            productVariantRepository.save(variant);
        } else {
            throw new BadRequestException("Variant ID is required for stock deduction");
        }
    }

    @Transactional(value = "productTransactionManager", propagation = Propagation.REQUIRES_NEW)
    @CacheEvict(value = "products", key = "'id:' + #productId")
    public void restoreStock(Long productId, Long variantId, int quantity) {
        if (variantId != null) {
            ProductVariant variant = productVariantRepository.findById(variantId).orElse(null);
            if (variant != null) {
                variant.setStock(variant.getStock() + quantity);
                productVariantRepository.save(variant);
            }
        }
    }

    private ProductInternalDTO mapToDTO(Product product) {
        int totalStock = product.getVariants() != null ? 
                product.getVariants().stream().mapToInt(ProductVariant::getStock).sum() : 0;
        return ProductInternalDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .price(product.getMinPrice())
                .thumbnailUrl(product.getThumbnailUrl())
                .stock(totalStock)
                .active(product.isActive())
                .variants(product.getVariants().stream()
                        .map(v -> VariantInternalDTO.builder()
                                .id(v.getId())
                                .name(v.getName())
                                .price(v.getPrice())
                                .stock(v.getStock())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
