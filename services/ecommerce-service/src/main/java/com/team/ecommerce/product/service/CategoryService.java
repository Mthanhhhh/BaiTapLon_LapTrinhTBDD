package com.team.ecommerce.product.service;

import com.team.ecommerce.product.dto.CategoryResponse;
import com.team.ecommerce.product.dto.CreateCategoryRequest;
import com.team.ecommerce.product.entity.Category;
import com.team.ecommerce.product.repository.CategoryRepository;
import com.team.ecommerce.shared.exception.BadRequestException;
import com.team.ecommerce.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional("productTransactionManager")
public class CategoryService {
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getRootCategories() {
        return categoryRepository.findByParentIdIsNullOrderByDisplayOrder().stream()
                .map(CategoryResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getSubCategories(Long parentId) {
        return categoryRepository.findByParentIdOrderByDisplayOrder(parentId).stream()
                .map(CategoryResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        return CategoryResponse.from(category);
    }

    public CategoryResponse createCategory(CreateCategoryRequest request) {
        if (categoryRepository.existsBySlug(request.getSlug())) {
            throw new BadRequestException("Category slug already exists");
        }

        if (request.getParentId() != null) {
            categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent Category", "id", request.getParentId()));
        }

        Category category = Category.builder()
                .name(request.getName())
                .slug(request.getSlug())
                .parentId(request.getParentId())
                .iconUrl(request.getIconUrl())
                .displayOrder(request.getDisplayOrder())
                .build();

        return CategoryResponse.from(categoryRepository.save(category));
    }

    public CategoryResponse updateCategory(Long id, CreateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        if (!category.getSlug().equals(request.getSlug()) && categoryRepository.existsBySlug(request.getSlug())) {
            throw new BadRequestException("Category slug already exists");
        }

        if (request.getParentId() != null) {
            if (id.equals(request.getParentId())) {
                throw new BadRequestException("Category cannot be its own parent");
            }
            categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent Category", "id", request.getParentId()));
        }

        category.setName(request.getName());
        category.setSlug(request.getSlug());
        category.setParentId(request.getParentId());
        category.setIconUrl(request.getIconUrl());
        category.setDisplayOrder(request.getDisplayOrder());

        return CategoryResponse.from(categoryRepository.save(category));
    }

    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        
        List<Category> subCategories = categoryRepository.findByParentIdOrderByDisplayOrder(id);
        if (!subCategories.isEmpty()) {
            throw new BadRequestException("Cannot delete category with subcategories");
        }
        
        categoryRepository.delete(category);
    }
}
