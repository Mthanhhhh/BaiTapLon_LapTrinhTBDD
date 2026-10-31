import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Modal, SafeAreaView, Platform, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, spacing, radius } from '../theme';
import { Typography, ProductCard, ProductListItem, Button } from '../components/ui';
import { useProductsInfinite } from '../hooks/useProducts';
import { SORT_OPTIONS } from '../constants/sort';
import { STRINGS } from '../constants/strings';
import { searchHistory } from '../utils/searchHistory';

export default function SearchScreen() {
  const { user } = useContext(AuthContext);
  const previousUser = useRef(user?.id);
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  
  const initialKeyword = route.params?.keyword || '';
  const initialCategoryId = route.params?.categoryId || null;
  const initialCategoryName = route.params?.categoryName || '';
  const initialSort = route.params?.sort || SORT_OPTIONS.BEST_SALES;

  const [keyword, setKeyword] = useState(initialKeyword);
  const [debouncedKeyword, setDebouncedKeyword] = useState(initialKeyword);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [categoryName, setCategoryName] = useState(initialCategoryName);
  const [recentKeywords, setRecentKeywords] = useState<string[]>([]);
  
  const [sort, setSort] = useState(initialSort); 
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadRecentKeywords = async () => {
    const list = await searchHistory.getKeywords();
    setRecentKeywords(list);
  };

  useEffect(() => {
    if (previousUser.current !== user?.id) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setKeyword('');setDebouncedKeyword('');setCategoryId(null);setCategoryName('');
      previousUser.current=user?.id;
    }
    loadRecentKeywords();
  },[user?.id]);

  useEffect(() => {
    loadRecentKeywords();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handler = () => loadRecentKeywords();
      window.addEventListener('searchHistory:updated', handler);
      return () => window.removeEventListener('searchHistory:updated', handler);
    }
  }, []);

  useEffect(() => {
    if (debouncedKeyword.trim().length >= 2) {
      searchHistory.recordKeyword(debouncedKeyword.trim());
    }
  }, [debouncedKeyword]);

  useEffect(() => {
    if (categoryId) {
      searchHistory.recordViewedCategory(categoryId);
    }
  }, [categoryId]);
  
  useEffect(() => {
    if (route.params?.keyword !== undefined) {
      setKeyword(route.params.keyword);
      setDebouncedKeyword(route.params.keyword);
    }
    if (route.params?.categoryId !== undefined) {
      setCategoryId(route.params.categoryId);
      setCategoryName(route.params.categoryName || '');
    }
    if (route.params?.sort !== undefined) {
      setSort(route.params.sort);
    }
  }, [route.params]);

  const handleSearchChange = (text: string) => {
    setKeyword(text);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDebouncedKeyword(text);
    }, 400);
  };

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } = useProductsInfinite({
    keyword: debouncedKeyword,
    categoryId,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sort,
  });

  const products = data?.pages.flatMap(page => page.content) || [];

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
  };

  const renderItem = ({ item }: { item: any }) => {
    if (layout === 'grid') {
      return (
        <View style={{ width: '48%' }}>
          <ProductCard
            id={item.id}
            name={item.name}
            price={item.price}
            originalPrice={item.originalPrice}
            thumbnailUrl={item.thumbnailUrl}
            rating={item.rating}
            soldCount={item.soldCount}
            shopName={item.shopName}
            shopLocation={item.shopLocation}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
          />
        </View>
      );
    }
    return (
      <ProductListItem
        id={item.id}
        name={item.name}
        price={item.price}
        originalPrice={item.originalPrice}
        thumbnailUrl={item.thumbnailUrl}
        rating={item.rating}
        soldCount={item.soldCount}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      />
    );
  };

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return <ActivityIndicator size="small" color={COLORS.primaryDeep} style={{ margin: spacing.md }} />;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titleRow}>
        <Typography variant="xxl" weight="bold" role="heading" aria-level={1}>{STRINGS.SEARCH_TITLE}</Typography>
        <Typography variant="sm" color="inkSoft">{categoryName || 'Khám phá toàn bộ sản phẩm'}</Typography>
      </View>
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={STRINGS.SEARCH_PLACEHOLDER}
            placeholderTextColor={COLORS.muted}
            value={keyword}
            onChangeText={handleSearchChange}
            autoCorrect={false}
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.muted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Bộ lọc sản phẩm" style={styles.filterBtn} onPress={() => setIsFilterVisible(true)}>
          <Ionicons name="funnel-outline" size={24} color={COLORS.primaryDeep} />
        </TouchableOpacity>
      </View>

      {/* Lịch sử tìm kiếm gần đây */}
      {recentKeywords.length > 0 && !keyword && (
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time-outline" size={14} color={COLORS.inkSoft} style={{ marginRight: 4 }} />
              <Typography variant="xs" weight="semiBold" color="inkSoft">Tìm kiếm gần đây</Typography>
            </View>
            <TouchableOpacity onPress={async () => {
              await searchHistory.clearKeywords();
              setRecentKeywords([]);
            }}>
              <Typography variant="xs" color="muted">Xóa tất cả</Typography>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyList}>
            {recentKeywords.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.historyChip}
                onPress={() => {
                  setKeyword(item);
                  setDebouncedKeyword(item);
                }}
              >
                <Typography variant="xs" color="ink">{item}</Typography>
                <TouchableOpacity
                  onPress={async () => {
                    const updated = await searchHistory.removeKeyword(item);
                    setRecentKeywords(updated);
                  }}
                  style={{ marginLeft: 6 }}
                >
                  <Ionicons name="close-circle" size={14} color={COLORS.muted} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {categoryId && (
        <View style={styles.categoryTagContainer}>
          <View style={styles.categoryTag}>
            <Typography variant="xs" color="primaryDeep">
              Danh mục: {categoryName || 'Tất cả'}
            </Typography>
            <TouchableOpacity onPress={() => {
              setCategoryId(null);
              setCategoryName('');
              navigation.setParams({ categoryId: null, categoryName: '' });
            }}>
              <Ionicons name="close" size={14} color={COLORS.primaryDeep} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.sortBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortOptions}>
          <TouchableOpacity onPress={() => handleSortChange(SORT_OPTIONS.BEST_SALES)} style={styles.sortBtn}>
            <Typography variant="sm" weight="medium" color={sort === SORT_OPTIONS.BEST_SALES ? 'primaryDeep' : 'ink'}>Bán chạy</Typography>
            {sort === SORT_OPTIONS.BEST_SALES && <View style={styles.activeSortIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleSortChange(SORT_OPTIONS.POPULAR)} style={styles.sortBtn}>
            <Typography variant="sm" weight="medium" color={sort === SORT_OPTIONS.POPULAR ? 'primaryDeep' : 'ink'}>Phổ biến</Typography>
            {sort === SORT_OPTIONS.POPULAR && <View style={styles.activeSortIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleSortChange(sort === SORT_OPTIONS.PRICE_ASC ? SORT_OPTIONS.PRICE_DESC : SORT_OPTIONS.PRICE_ASC)} 
            style={styles.sortBtn}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Typography variant="sm" weight="medium" color={sort.startsWith('minPrice') ? 'primaryDeep' : 'ink'}>Giá cả</Typography>
              <Ionicons 
                name={sort === SORT_OPTIONS.PRICE_ASC ? 'caret-up' : sort === SORT_OPTIONS.PRICE_DESC ? 'caret-down' : 'swap-vertical'} 
                size={14} 
                color={sort.startsWith('minPrice') ? COLORS.primaryDeep : COLORS.ink} 
                style={{ marginLeft: 4 }}
              />
            </View>
            {sort.startsWith('minPrice') && <View style={styles.activeSortIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleSortChange(SORT_OPTIONS.RATING)} style={styles.sortBtn}>
            <Typography variant="sm" weight="medium" color={sort === SORT_OPTIONS.RATING ? 'primaryDeep' : 'ink'}>Đánh giá</Typography>
            {sort === SORT_OPTIONS.RATING && <View style={styles.activeSortIndicator} />}
          </TouchableOpacity>
        </ScrollView>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={layout === 'grid' ? 'Xem dạng danh sách' : 'Xem dạng lưới'} style={styles.layoutToggle} onPress={() => setLayout(l => l === 'grid' ? 'list' : 'grid')}>
          <Ionicons name={layout === 'grid' ? 'list' : 'grid'} size={22} color={COLORS.ink} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primaryDeep} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="search-outline" size={64} color={COLORS.muted} />
          <Typography variant="md" color="muted" style={{ marginTop: spacing.md }}>
            Không tìm thấy sản phẩm nào
          </Typography>
        </View>
      ) : (
        <FlatList
          key={layout} 
          data={products}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderItem}
          numColumns={layout === 'grid' ? 2 : 1}
          columnWrapperStyle={layout === 'grid' ? styles.row : undefined}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          windowSize={5}
        />
      )}

      <Modal visible={isFilterVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Typography variant="lg" weight="bold">Bộ lọc tìm kiếm</Typography>
              <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.ink} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.sheetContent}>
              <Typography variant="md" weight="medium" style={{ marginBottom: spacing.sm }}>Khoảng giá</Typography>
              <View style={styles.priceInputs}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Thấp nhất"
                  keyboardType="numeric"
                  value={minPrice}
                  onChangeText={setMinPrice}
                />
                <View style={styles.priceSeparator} />
                <TextInput
                  style={styles.priceInput}
                  placeholder="Cao nhất"
                  keyboardType="numeric"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                />
              </View>
            </View>

            <View style={styles.sheetFooter}>
              <Button
                title="Thiết lập lại"
                variant="outline"
                style={{ flex: 1, marginRight: spacing.sm }}
                onPress={() => {
                  setMinPrice('');
                  setMaxPrice('');
                }}
              />
              <Button
                title="Áp dụng"
                variant="primary"
                style={{ flex: 1 }}
                onPress={() => {
                  setIsFilterVisible(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleRow: { paddingHorizontal: spacing.md, paddingTop: 24, paddingBottom: 8, gap: 5, backgroundColor: COLORS.surface },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: COLORS.surface,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 46,
    marginRight: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: COLORS.ink,
  },
  filterBtn: {
    padding: spacing.xs,
  },
  categoryTagContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: COLORS.surface,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  historyContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  historyList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  historyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  sortOptions: {
    flexGrow: 1,
    alignItems: 'center',
  },
  sortBtn: {
    marginRight: spacing.lg,
    height: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  activeSortIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.primaryDeep,
    borderRadius: 2,
  },
  layoutToggle: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sheetContent: {
    marginBottom: spacing.xl,
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
    color: COLORS.ink,
  },
  priceSeparator: {
    width: 12,
    height: 1,
    backgroundColor: COLORS.muted,
    marginHorizontal: spacing.sm,
  },
  sheetFooter: {
    flexDirection: 'row',
  },
});
