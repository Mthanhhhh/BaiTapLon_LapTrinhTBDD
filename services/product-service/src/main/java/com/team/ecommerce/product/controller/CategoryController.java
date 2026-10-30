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
