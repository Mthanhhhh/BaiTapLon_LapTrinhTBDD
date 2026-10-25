import React, { useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  Typography,
  AuroraBackground,
  ProductCard,
  Skeleton,
  Button,
  RemoteImage,
} from '../components/ui';
import { COLORS, spacing, radius } from '../theme';
import {
  useCategories,
  useBestSales,
  usePopular,
  useProductsInfinite,
  useHomeBanner,
  CategoryResponse,
  ProductListResponse,
} from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { SORT_OPTIONS } from '../constants/sort';

import { STRINGS } from '../constants/strings';

const getCategoryIcon = (slug?: string): keyof typeof Ionicons.glyphMap => {
  switch (slug) {
    case 'electronics':
      return 'phone-portrait-outline';
    case 'fashion':
      return 'shirt-outline';
    case 'beauty':
      return 'sparkles-outline';
    case 'fresh-fruits':
      return 'nutrition-outline';
    default:
      return 'grid-outline';
  }
};

export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { data: cartData } = useCart();
  const { data: bannerProduct, isLoading: bannerLoading, refetch: refetchBanner } = useHomeBanner();
  const { data: categories, isLoading: catLoading, refetch: refetchCat } = useCategories();
  const { data: bestSales, isLoading: bestLoading, refetch: refetchBest } = useBestSales();
  const { data: popular, isLoading: popLoading, refetch: refetchPop } = usePopular();
  const {
    data: productsPage,
    isLoading: prodLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch: refetchProd,
    isError,
  } = useProductsInfinite();

  const handleRefresh = async () => {
    await Promise.all([refetchBanner(), refetchCat(), refetchBest(), refetchPop(), refetchProd()]);
  };

  const renderHeader = () => {
    const bannerDiscount =
      bannerProduct && bannerProduct.originalPrice && bannerProduct.originalPrice > bannerProduct.price
        ? Math.round((1 - bannerProduct.price / bannerProduct.originalPrice) * 100)
        : 0;

    return (
      <View style={styles.headerContainer}>
        {/* Aurora Background covering header, search and banner (230px) */}
        <AuroraBackground variant="header" headerHeight={230} palette="candy">
          <SafeAreaView style={styles.headerSafeArea}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.searchPill}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Main', { screen: 'Search' })}
              >
                <Ionicons name="search" size={20} color={COLORS.muted} style={{ marginRight: spacing.sm }} />
                <Typography variant="md" color="muted">
                  {STRINGS.SEARCH_PLACEHOLDER}
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cartButton}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Checkout')}
              >
                <Ionicons name="cart-outline" size={24} color={COLORS.ink} />
                {(cartData?.totalItems ?? 2) > 0 && (
                  <View style={styles.cartBadge}>
                    <Typography variant="xs" color="surface" weight="bold" style={{ fontSize: 10 }}>
                      {(cartData?.totalItems ?? 2) > 99 ? '99+' : (cartData?.totalItems ?? 2)}
                    </Typography>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Hero Banner: Inside Aurora 16px below Search */}
            <View style={styles.bannerWrapper}>
              {bannerLoading ? (
                <Skeleton width="100%" height={130} borderRadius={radius.lg} style={styles.bannerSkeleton} />
              ) : bannerProduct ? (
                <TouchableOpacity
                  style={styles.banner}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate('ProductDetail', { productId: bannerProduct.id })}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDeep]}
                    style={styles.bannerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.bannerText}>
                      <Typography variant="lg" weight="bold" color="surface" numberOfLines={1}>
                        {bannerProduct.name}
                      </Typography>
                      <Typography variant="sm" color="surfaceAlt" style={{ marginTop: 2 }}>
                        {bannerDiscount > 0 ? `Up to ${bannerDiscount}% OFF` : 'Best Value Deal'}
                      </Typography>
                      <View style={styles.bannerButton}>
                        <Typography variant="xs" weight="bold" color="primaryDeep">
                          Shop now
                        </Typography>
                      </View>
                    </View>
                    <View style={styles.bannerImageContainer}>
                      <RemoteImage
                        sourceUrl={bannerProduct.thumbnailUrl}
                        name={bannerProduct.name}
                        style={styles.bannerImage}
                        iconSize={32}
                      />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ) : null}
            </View>
          </SafeAreaView>
        </AuroraBackground>

        <View style={styles.content}>

          {/* Categories Grid */}
          <Typography variant="lg" weight="bold" style={styles.sectionTitle}>
            Categories
          </Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
            {catLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <View key={i} style={styles.catItem}>
                    <Skeleton width={56} height={56} borderRadius={28} style={{ marginBottom: spacing.xs }} />
                    <Skeleton width={60} height={14} />
                  </View>
                ))
              : categories?.map((cat: CategoryResponse, index: number) => {
                  const pastelBg = [COLORS.sky, COLORS.peach, COLORS.mint, COLORS.lilac, COLORS.pink][index % 5];
                  const iconName = getCategoryIcon(cat.slug);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={styles.catItem}
                      activeOpacity={0.8}
                      onPress={() =>
                        navigation.navigate('Main', {
                          screen: 'Search',
                          params: { categoryId: cat.id, categoryName: cat.name },
                        })
                      }
                    >
                      <View style={[styles.catIcon, { backgroundColor: pastelBg }]}>
                        <Ionicons name={iconName} size={26} color={COLORS.ink} />
                      </View>
                      <Typography variant="xs" align="center" numberOfLines={2} style={styles.catName}>
                        {cat.name}
                      </Typography>
                    </TouchableOpacity>
                  );
                })}
          </ScrollView>

          {/* Best Sales */}
          <View style={styles.sectionHeader}>
            <Typography variant="lg" weight="bold">
              Best Sales
            </Typography>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Main', {
                  screen: 'Search',
                  params: { sort: SORT_OPTIONS.BEST_SALES },
                })
              }
            >
              <Typography variant="sm" color="primaryDeep" weight="semiBold">
                See all
              </Typography>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
            {bestLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <View key={i} style={{ width: 160, marginRight: spacing.md }}>
                    <Skeleton width={160} height={160} borderRadius={radius.lg} style={{ marginBottom: spacing.sm }} />
                    <Skeleton width={120} height={16} style={{ marginBottom: 4 }} />
                    <Skeleton width={80} height={16} />
                  </View>
                ))
              : bestSales?.map((prod: ProductListResponse) => (
                  <View key={prod.id} style={{ width: 160, marginRight: spacing.md }}>
                    <ProductCard
                      {...prod}
                      onPress={() => navigation.navigate('ProductDetail', { productId: prod.id })}
                    />
                  </View>
                ))}
          </ScrollView>

          {/* Popular Products */}
          <View style={styles.sectionHeader}>
            <Typography variant="lg" weight="bold">
              Popular
            </Typography>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Main', {
                  screen: 'Search',
                  params: { sort: SORT_OPTIONS.POPULAR },
                })
              }
            >
              <Typography variant="sm" color="primaryDeep" weight="semiBold">
                See all
              </Typography>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
            {popLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <View key={i} style={{ width: 160, marginRight: spacing.md }}>
                    <Skeleton width={160} height={160} borderRadius={radius.lg} style={{ marginBottom: spacing.sm }} />
                    <Skeleton width={120} height={16} style={{ marginBottom: 4 }} />
                    <Skeleton width={80} height={16} />
                  </View>
                ))
              : popular?.map((prod: ProductListResponse) => (
                  <View key={prod.id} style={{ width: 160, marginRight: spacing.md }}>
                    <ProductCard
                      {...prod}
                      onPress={() => navigation.navigate('ProductDetail', { productId: prod.id })}
                    />
                  </View>
                ))}
          </ScrollView>

          {/* Recommended Header */}
          <Typography variant="lg" weight="bold" style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
            Recommended for you
          </Typography>
        </View>
      </View>
    );
  };

  const allProducts = useMemo(() => {
    if (!productsPage) return [];
    return productsPage.pages.flatMap((page: any) => page.content);
  }, [productsPage]);

  const renderProduct = useCallback(
    ({ item }: { item: ProductListResponse }) => (
      <View style={{ width: '48%' }}>
        <ProductCard
          {...item}
          onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        />
      </View>
    ),
    [navigation]
  );

  if (isError && allProducts.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
        <Typography variant="md" color="danger" style={{ marginTop: spacing.sm }}>
          Failed to load products.
        </Typography>
        <Button title="Retry" onPress={handleRefresh} style={{ marginTop: spacing.md }} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={allProducts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} />}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ paddingVertical: spacing.md, alignItems: 'center' }}>
              <Skeleton width="90%" height={80} borderRadius={radius.md} />
            </View>
          ) : null
        }
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    marginBottom: spacing.sm,
  },
  headerSafeArea: {
    paddingTop: Platform.OS === 'android' ? 36 : 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: 8,
  },
  bannerWrapper: {
    paddingHorizontal: spacing.md,
    marginTop: 10,
  },
  bannerSkeleton: {
    marginBottom: spacing.xs,
  },
  banner: {
    width: '100%',
    height: 126,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xs,
    shadowColor: COLORS.primaryDeep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bannerGradient: {
    flex: 1,
    flexDirection: 'row',
    padding: spacing.md,
    alignItems: 'center',
  },
  bannerText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  bannerButton: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  bannerImageContainer: {
    width: 90,
    height: 90,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: COLORS.surfaceAlt,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  hScroll: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  catItem: {
    alignItems: 'center',
    marginRight: spacing.sm,
    width: 76, // Exactly ~76px per item
  },
  catIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  catName: {
    minHeight: 28,
    lineHeight: 14,
  },
  listContent: {
    paddingBottom: 110, // Tab bar height + safe area + 16px
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
});
