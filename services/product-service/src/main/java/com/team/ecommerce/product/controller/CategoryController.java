package com.team.ecommerce.product.controller;

import com.team.ecommerce.product.dto.CategoryResponse;
import com.team.ecommerce.product.dto.CreateCategoryRequest;
import com.team.ecommerce.product.service.CategoryService;
import com.team.ecommerce.shared.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;
    private final com.team.ecommerce.product.repository.CategoryRepository categories;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;

    @GetMapping("/{id}/shops")
    public ApiResponse<?> shops(@PathVariable Long id) {
        return ApiResponse.success(jdbc.queryForList("""
            SELECT s.id,s.name,s.province,s.logo_url AS logoUrl,s.rating_avg AS ratingAvg,
                   s.rating_count AS ratingCount,COUNT(p.id) AS productCount,
                   COALESCE(SUM(p.sold_count),0) AS soldCount,c.source_url AS sourceUrl
            FROM shop_category_links l JOIN shops s ON s.id=l.shop_id
            JOIN classroom_catalog_shops c ON c.shop_id=s.id
            LEFT JOIN products p ON p.shop_id=s.id AND p.status='ACTIVE' AND p.deleted_at IS NULL
            WHERE l.category_id=? AND s.status='ACTIVE' AND s.deleted_at IS NULL
            GROUP BY s.id,s.name,s.province,s.logo_url,s.rating_avg,s.rating_count,c.source_url
            ORDER BY productCount DESC,s.name
            """,id));
    }

    @GetMapping("/{id}/sources")
    public ApiResponse<?> sources(@PathVariable Long id) {
        return ApiResponse.success(jdbc.queryForList("SELECT s.id,s.name,s.source_url AS sourceUrl,s.provider,s.status,s.checked_at AS checkedAt,s.note FROM catalog_source_shops s JOIN catalog_source_shop_categories c ON c.source_shop_id=s.id WHERE c.category_id=? ORDER BY s.name",id));
    }

    @GetMapping("/catalog")
    public ApiResponse<List<CategoryResponse>> catalog() { return ApiResponse.success(categories.findAll().stream().filter(c -> Boolean.TRUE.equals(c.getActive())).sorted(java.util.Comparator.comparing(com.team.ecommerce.product.entity.Category::getDisplayOrder)).map(CategoryResponse::from).toList()); }

    @GetMapping
    public ApiResponse<List<CategoryResponse>> getRootCategories() {
        return ApiResponse.success(categoryService.getRootCategories());
    }

    @GetMapping("/{id}")
    public ApiResponse<CategoryResponse> getCategoryById(@PathVariable Long id) {
        return ApiResponse.success(categoryService.getCategoryById(id));
    }

    @GetMapping("/{id}/subcategories")
    public ApiResponse<List<CategoryResponse>> getSubCategories(@PathVariable Long id) {
        return ApiResponse.success(categoryService.getSubCategories(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CategoryResponse> createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        return ApiResponse.success("Category created successfully", categoryService.createCategory(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CategoryResponse> updateCategory(@PathVariable Long id, @Valid @RequestBody CreateCategoryRequest request) {
        return ApiResponse.success("Category updated successfully", categoryService.updateCategory(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ApiResponse.success("Category deleted successfully", null);
    }
}
