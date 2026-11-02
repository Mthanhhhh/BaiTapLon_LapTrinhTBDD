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
import java.text.Normalizer;
import java.util.Locale;

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

    public java.util.Map<String,Object> filterOptions(){return java.util.Map.of("provinces",jdbc.queryForList("SELECT DISTINCT s.province FROM shops s JOIN products p ON p.shop_id=s.id WHERE s.status='ACTIVE' AND p.status='ACTIVE' AND p.deleted_at IS NULL AND s.province IS NOT NULL AND s.province<>'' ORDER BY s.province",String.class),"brands",jdbc.queryForList("SELECT DISTINCT b.id,b.name FROM brands b JOIN products p ON p.brand_id=b.id WHERE p.deleted_at IS NULL AND p.status='ACTIVE' ORDER BY b.name"));}

    public PageResponse<ProductListResponse> recommendations(String keyword,int page,int size) {
        return recommendations(keyword,page,size,java.util.List.of());
    }
    public PageResponse<ProductListResponse> recommendations(String keyword,int page,int size,java.util.List<Long> aiRanking) {
        // The keyword ranks the full active catalog; it must never filter out other products.
        var paging=org.springframework.data.domain.PageRequest.of(Math.max(0,page),Math.max(1,Math.min(size,50)));
        var terms=java.util.Arrays.stream(java.util.Objects.toString(keyword,"").split("\\|")).map(String::trim).filter(t->!t.isBlank()).limit(5).toList();
        var semantic=terms.stream().map(this::findSemanticCategoryIds).toList();
        var result=productRepository.findAll((root,query,cb)->{
            var active=cb.and(cb.equal(root.get("status"),ProductStatus.ACTIVE),cb.isNull(root.get("deletedAt")));
            if (query != null && query.getResultType() != Long.class && query.getResultType() != long.class) {
                var ranking=new java.util.ArrayList<jakarta.persistence.criteria.Order>();
                if(!aiRanking.isEmpty()){var aiPriority=cb.<Integer>selectCase();for(int i=0;i<aiRanking.size();i++)aiPriority.when(cb.equal(root.get("id"),aiRanking.get(i)),aiRanking.size()-i);ranking.add(cb.desc(aiPriority.otherwise(0)));}
                jakarta.persistence.criteria.Expression<Integer> priority=cb.literal(0);
                for(int i=0;i<terms.size();i++){
                    String pattern="%"+terms.get(i).toLowerCase(java.util.Locale.ROOT)+"%";
                    var related=cb.like(cb.lower(root.<String>get("name")),pattern);
                    if(!semantic.get(i).isEmpty())related=cb.or(related,root.get("categoryId").in(semantic.get(i)));
                    priority=cb.sum(priority,cb.<Integer>selectCase().when(related,(5-i)*100).otherwise(0));
                }
                if(!terms.isEmpty())ranking.add(cb.desc(priority));
                var weighted=cb.quot(cb.sum(cb.prod(root.<Number>get("ratingAvg"),root.<Number>get("ratingCount")),84),cb.sum(root.<Number>get("ratingCount"),20));
                ranking.add(cb.desc(weighted));
                ranking.add(cb.desc(root.get("ratingAvg")));
                ranking.add(cb.desc(root.get("ratingCount")));
                ranking.add(cb.desc(root.get("soldCount")));
                ranking.add(cb.desc(root.get("id")));
                query.orderBy(ranking);
            }
            return cb.and(active,ProductSpecification.search(null,null,null,null,null).toPredicate(root,query,cb));
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
        // Category intent should search the catalog category even if the product title
        // does not contain the user's phrase (for example "điện thoại" -> Samsung S23).
        Set<Long> semanticCategoryIds = request.getCategoryId() == null
                ? findSemanticCategoryIds(request.getKeyword()) : Set.of();
        boolean hasExtraFilters = request.getBrandId()!=null || (request.getProvince()!=null&&!request.getProvince().isBlank()) || request.getMinPrice() != null || request.getMaxPrice() != null || request.getMinRating() != null;
        if (!hasExtraFilters && !semanticCategoryIds.isEmpty() && request.getKeyword() != null
                && isCategoryIntent(request.getKeyword())) {
            Page<Product> semanticPage = productRepository.findByCategoryIdInAndDeletedAtIsNullAndStatus(
                    semanticCategoryIds, ProductStatus.ACTIVE, pageable);
            if (semanticPage.getTotalElements() > 0) return mapToPageResponse(semanticPage);
        }
        // Exact catalog results retain database pagination and every selected filter.
        var filters=ProductSpecification.search(request.getKeyword(),request.getCategoryId(),
                request.getMinPrice(),request.getMaxPrice(),request.getMinRating(),request.getBrandId(),request.getProvince());
        Page<Product> page=productRepository.findAll(filters,pageable);
        if(page.getTotalElements()>0 || request.getKeyword()==null || request.getKeyword().isBlank())return mapToPageResponse(page);
        // Typo fallback still uses Elasticsearch, then applies category descendants, price and rating in SQL.
        List<Long> esIds=elasticsearchSyncService.searchProductIds(request.getKeyword(),null,
                request.getMinPrice()==null?null:request.getMinPrice().doubleValue(),
                request.getMaxPrice()==null?null:request.getMaxPrice().doubleValue(),10000);
        if(esIds.isEmpty())return mapToPageResponse(page);
        var fuzzyFilters=ProductSpecification.search(null,request.getCategoryId(),request.getMinPrice(),request.getMaxPrice(),request.getMinRating(),request.getBrandId(),request.getProvince())
                .and((root,query,cb)->root.get("id").in(esIds));
        return mapToPageResponse(productRepository.findAll(fuzzyFilters,pageable));
    }

    private Set<Long> findSemanticCategoryIds(String keyword) {
        String query = normalize(keyword);
        if (query.isBlank()) return Set.of();
        List<String> family = new ArrayList<>();
        if (containsAny(query, "dien thoai", "smartphone", "phone", "mobile", "iphone", "samsung", "galaxy", "xiaomi", "oppo", "vivo"))
            family.addAll(List.of("dien thoai", "smartphone", "phone", "mobile", "iphone"));
        if (containsAny(query, "laptop", "notebook", "macbook")) family.addAll(List.of("laptop", "notebook", "may tinh xach tay"));
        if (containsAny(query, "tai nghe", "headphone", "earphone", "earbuds", "airpods")) family.addAll(List.of("tai nghe", "headphone", "earphone", "earbuds"));
        if (containsAny(query, "may tinh bang", "tablet", "ipad")) family.addAll(List.of("may tinh bang", "tablet", "ipad"));
        if (containsAny(query, "tivi", "television", "smart tv")) family.addAll(List.of("tivi", "television", "smart tv"));
        if (family.isEmpty()) return Set.of();

        List<Category> all = categoryRepository.findAll();
        Set<Long> ids = new LinkedHashSet<>();
        for (Category category : all) {
            String label = normalize(category.getName() + " " + category.getSlug());
            if (family.stream().anyMatch(label::contains)) {
                ids.add(category.getId());
                String path = category.getPath();
                if (path != null && !path.isBlank() && !path.equals("/"))
                    categoryRepository.findByPathStartingWith(path).forEach(child -> ids.add(child.getId()));
            }
        }
        return ids;
    }

    private boolean isCategoryIntent(String keyword) {
        String query = normalize(keyword);
        return containsAny(query, "dien thoai", "smartphone", "phone", "mobile", "laptop", "notebook", "macbook",
                "tai nghe", "headphone", "earphone", "earbuds", "may tinh bang", "tablet", "tivi", "television");
    }

    private boolean containsAny(String value, String... terms) {
        for (String term : terms) if (value.contains(term)) return true;
        return false;
    }

    private String normalize(String value) {
        if (value == null) return "";
        String decomposed = Normalizer.normalize(value.toLowerCase(Locale.ROOT).replace('đ', 'd'), Normalizer.Form.NFD);
        return decomposed.replaceAll("\\p{M}+", "").replaceAll("[^a-z0-9 ]", " ").replaceAll("\\s+", " ").trim();
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
        Integer ownsShop = jdbc.queryForObject("SELECT COUNT(*) FROM product_db.shops WHERE id=? AND owner_user_id=? AND status='ACTIVE' AND deleted_at IS NULL", Integer.class, shopId, userId);
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
        if(product.getStatus()==ProductStatus.BANNED)throw new BadRequestException("Sản phẩm đang bị quản trị khóa bán.");

        if (request.getCategoryId() != null) {
            if (!categoryRepository.existsById(request.getCategoryId())) {
                throw new ResourceNotFoundException("Category", "id", request.getCategoryId());
            }
            product.setCategoryId(request.getCategoryId());
        }

        if (request.getName() != null) {
            product.setName(request.getName());
            product.setSlug(request.getName().toLowerCase().replaceAll("\\s+", "-")+"-"+id);
        }
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getPrice() != null && request.getVariants()==null) {
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

        if (request.getStock() != null && request.getVariants()==null) {
            List<ProductVariant> variants = productVariantRepository.findByProductId(id);
            // The legacy edit form has one stock field; only apply it when the product
            // has one SKU, so a total stock value is not copied to every variation.
            if (variants.size() == 1) variants.get(0).setStock(request.getStock());
        }

        if (request.getImages() != null) {
            if(request.getImages().size()>30||request.getImages().stream().anyMatch(url->url==null||!url.startsWith("https://")||url.length()>500))throw new BadRequestException("Thư viện ảnh cần URL HTTPS hợp lệ, tối đa 30 ảnh.");
            jdbc.update("DELETE FROM product_db.product_images WHERE product_id=?",id);
            for(int i=0;i<request.getImages().size();i++)jdbc.update("INSERT INTO product_db.product_images(product_id,url,sort_order,is_primary) VALUES(?,?,?,?)",id,request.getImages().get(i),i,i==0);
        }

        if (request.getVariants() != null) {
            if(request.getVariants().isEmpty()||request.getVariants().size()>100)throw new BadRequestException("Cần 1–100 phân loại.");
            var previous=new java.util.ArrayList<>(product.getVariants());
            var retained=new java.util.HashSet<Long>();
            var names=new java.util.HashSet<String>();
            for(ProductVariantRequest vr:request.getVariants()){
                if(vr.getName()==null||vr.getName().isBlank()||!names.add(vr.getName().trim())||vr.getPrice()==null||vr.getPrice().signum()<=0||vr.getStock()<0)throw new BadRequestException("Kiểm tra tên, giá và tồn kho phân loại.");
                ProductVariant variant=vr.getId()==null?previous.stream().filter(v->v.getName().equals(vr.getName().trim())).findFirst().orElse(null):previous.stream().filter(v->v.getId().equals(vr.getId())).findFirst().orElseThrow(()->new BadRequestException("Phân loại không thuộc sản phẩm."));
                if(variant==null){variant=ProductVariant.builder().product(product).sku("SELLER-"+id+"-"+java.util.UUID.randomUUID().toString().substring(0,8)).name(vr.getName().trim()).price(vr.getPrice()).originalPrice(vr.getPrice()).stock(vr.getStock()).build();product.getVariants().add(variant);}
                else {
                    if(vr.getVersion()!=null&&!java.util.Objects.equals(vr.getVersion(),variant.getVersion()))throw new BadRequestException("Giá hoặc tồn kho vừa thay đổi. Hãy tải lại sản phẩm trước khi sửa.");
                    retained.add(variant.getId());variant.setName(vr.getName().trim());variant.setPrice(vr.getPrice());variant.setStock(vr.getStock());
                }
            }
            for(ProductVariant old:previous)if(!retained.contains(old.getId()))old.setDeletedAt(java.time.LocalDateTime.now());
            var active=product.getVariants().stream().filter(v->v.getDeletedAt()==null).toList();
            product.setMinPrice(active.stream().map(ProductVariant::getPrice).min(java.math.BigDecimal::compareTo).orElseThrow());
            product.setMaxPrice(active.stream().map(ProductVariant::getPrice).max(java.math.BigDecimal::compareTo).orElseThrow());
        }
        if(product.getThumbnailUrl()==null||!product.getThumbnailUrl().startsWith("https://"))throw new BadRequestException("Cần ảnh bìa HTTPS hợp lệ.");

        Product savedProduct = productRepository.saveAndFlush(product);
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
        // Fetch category labels once per page instead of one SELECT for each card.
        var ids = page.getContent().stream().map(Product::getCategoryId)
                .filter(java.util.Objects::nonNull).distinct().toList();
        var names = categoryRepository.findAllById(ids).stream().collect(
                java.util.stream.Collectors.toMap(Category::getId, Category::getName));
        Page<ProductListResponse> responsePage = page.map(p -> ProductListResponse.from(p, names.get(p.getCategoryId())));
        return PageResponse.from(responsePage);
    }
}
