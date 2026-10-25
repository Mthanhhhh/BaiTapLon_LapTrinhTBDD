import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { SORT_OPTIONS, withStableSort } from '../constants/sort';

export interface ProductListResponse {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  thumbnailUrl: string | null;
  rating: number;
  ratingCount: number;
  soldCount: number;
  stock: number;
  categoryName: string;
}

export interface ProductVariantResponse {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

export interface ProductResponse {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  categoryId: number;
  categoryName: string;
  thumbnailUrl: string | null;
  images: string[];
  stock: number;
  rating: number;
  ratingCount: number;
  soldCount: number;
  variants: ProductVariantResponse[];
  createdAt: string;
  active: boolean;
}

export interface CategoryResponse {
  id: number;
  name: string;
  slug: string;
  displayOrder: number;
}

export interface ReviewResponse {
  id: number;
  productId: number;
  userId: number;
  userFullName: string;
  orderId: number;
  rating: number;
  comment?: string;
  emotion?: 'GOOD' | 'NEUTRAL' | 'BAD' | null;
  tags?: string[];
  imageUrls?: string[];
  createdAt: string;
}

export const useCategories = () => {
  return useQuery<CategoryResponse[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/categories');
      return data.data; // List<CategoryResponse>
    },
  });
};

export const useBestSales = () => {
  return useQuery<ProductListResponse[]>({
    queryKey: ['bestSales'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/products/best-sales', {
        params: { size: 10, sort: withStableSort(SORT_OPTIONS.BEST_SALES) },
      });
      return data.data.content;
    },
  });
};

export const usePopular = () => {
  return useQuery<ProductListResponse[]>({
    queryKey: ['popular'],
    queryFn: async () => {
      // Backend: /api/v1/products?sort=viewCount,desc (sorted by views as requested by B.1 & G.5)
      const { data } = await apiClient.get('/api/v1/products', {
        params: { size: 10, sort: withStableSort(SORT_OPTIONS.POPULAR) },
      });
      return data.data.content;
    },
  });
};

export const useHomeBanner = () => {
  return useQuery<ProductListResponse | null>({
    queryKey: ['homeBanner'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/v1/products', {
        params: { sort: [SORT_OPTIONS.BANNER_DISCOUNT, SORT_OPTIONS.SECONDARY_ID], size: 1 },
      });
      const content = data.data?.content || [];
      return content[0] || null;
    },
  });
};

export const useProductsInfinite = (params: any = {}) => {
  return useInfiniteQuery({
    queryKey: ['products', params],
    queryFn: async ({ pageParam = 0 }) => {
      const endpoint = params.categoryId 
        ? `/api/v1/products/category/${params.categoryId}`
        : params.keyword || params.minPrice || params.maxPrice
          ? `/api/v1/products/search`
          : `/api/v1/products`;
      
      // Default: category & search = soldCount,desc; Recommended at Home = ratingAvg,desc
      const defaultSort = (params.categoryId || params.keyword)
        ? SORT_OPTIONS.BEST_SALES 
        : SORT_OPTIONS.RATING;
      
      const sortValue = params.sort || defaultSort;
      const stableSort = withStableSort(sortValue);

      const queryParams = {
        ...params,
        sort: stableSort,
        page: pageParam,
        size: params.size || 20,
      };

      const { data } = await apiClient.get(endpoint, {
        params: queryParams,
      });
      return data.data; // PageResponse
    },
    getNextPageParam: (lastPage) => {
      return !lastPage.last ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 0,
  });
};

export const useProductDetail = (id: number) => {
  return useQuery<ProductResponse>({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/v1/products/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useProductReviews = (productId: number) => {
  return useQuery<ReviewResponse[]>({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/v1/products/${productId}/reviews`, {
        params: { size: 3, sort: ['createdAt,desc', 'id,desc'] },
      });
      return data.data?.content || [];
    },
    enabled: !!productId,
  });
};
