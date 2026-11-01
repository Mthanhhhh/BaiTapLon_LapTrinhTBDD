import {useProductOffer} from '../hooks/useProductOffer';
import {PurchaseSelector} from '../components/PurchaseSelector';
import {usePromotionCatalog,useCountdown} from '../hooks/usePromotions';
import {provinceLabel} from '../utils/vietnamShipping';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { COLORS, spacing, radius } from '../theme';
import {
  Typography,
  Button,
  Badge,
  ProductCard,
  RemoteImage,
  Skeleton,
} from '../components/ui';
import {
  useProductDetail,
  useProductReviews,
  useProductsInfinite,
  ProductVariantResponse,
  ReviewResponse,
  ProductListResponse,
} from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { useContentWidth } from '../hooks/useContentWidth';
import { searchHistory } from '../utils/searchHistory';
import { formatVND, formatSoldVi } from '../utils/formatters';
import { useShop } from '../hooks/useShop';

const STANDARD_SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const PREFERRED_COLOR_ORDER = ['Red', 'Orange', 'Blue'];

const EMOTION_ICONS: Record<string, string> = {
  GOOD: 'Hài lòng',
  NEUTRAL: 'Bình thường',
  BAD: 'Chưa hài lòng',
};

const TAG_NAMES: Record<string, string> = {
  SERVICE: 'Service',
  DELIVERY: 'Delivery',
  QUANTITY: 'Quantity',
  PAYMENT: 'Payment',
  PROMOTION: 'Promotion',
  GIFT: 'Gift',
};

const getAvatarPastel = (name: string) => {
  const PASTEL_PALETTE = ['#E8EDFF', '#FDE2E4', '#E2ECE9', '#FFF1E6', '#F3EEFF'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PASTEL_PALETTE[Math.abs(hash) % PASTEL_PALETTE.length];
};

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 month ago';
  if (diffMonths < 12) return `${diffMonths} months ago`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
}

export default function ProductDetailScreen() {
  const route = useRoute<any>();
  const [purchaseMode,setPurchaseMode]=useState<'cart'|'buy'|null>(route.params?.sheet==='true'?'cart':null);
  const navigation = useNavigation<any>();
  const { productId } = route.params || {};
  const numericProductId = Number(productId) || 0;
  const listingOffer=useProductOffer(numericProductId);
  const { data: ownedShop } = useShop();
  const promotionCatalog=usePromotionCatalog();
  const promotionClock=useCountdown();
  const contentWidth = useContentWidth();

  // Carousel size: 1:1 ratio, matching content frame width (max 480px)
  const carouselSize = contentWidth;

  const {
    data: product,
    isLoading: isProductLoading,
    isError: isProductError,
    refetch: refetchProduct,
  } = useProductDetail(numericProductId);
  const canEditProduct = !!route.params?.shopMode && !!product?.shopId && Number(product.shopId) === Number(ownedShop?.id);

  const { data: reviewsData, isLoading: isLoadingReviews } = useProductReviews(numericProductId);
  const { data: cartData } = useCart();

  // Related products query (using categoryId from loaded product)
  const categoryId = product?.categoryId;

  useEffect(() => {
    if (categoryId) {
      searchHistory.recordViewedCategory(categoryId);
    }
  }, [categoryId]);
  const { data: relatedData } = useProductsInfinite(categoryId ? { categoryId } : {});
  const relatedProducts = useMemo(() => {
    if (!relatedData || !product) return [];
    return (relatedData.pages.flatMap((page: any) => page.content) || [])
      .filter((p: ProductListResponse) => p.id !== product.id)
      .slice(0, 6);
  }, [relatedData, product]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const carouselRef = useRef<FlatList<string | null>>(null);


  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Variant management
  const variants: ProductVariantResponse[] = useMemo(() => product?.variants || [], [product]);
  const productMetadata = useMemo(() => {
    if (!product?.attributes) return {} as Record<string, any>;
    try { return JSON.parse(product.attributes) as Record<string, any>; }
    catch { return {} as Record<string, any>; }
  }, [product?.attributes]);

  // Check if all variants are in "Color / Size" format
  const canSplitVariants = useMemo(() => {
    if (!variants || variants.length <= 1) return false;
    return variants.every((v) => v.name.includes(' / ') && v.name.split(' / ').length === 2);
  }, [variants]);

  const isSingleDefault = useMemo(() => {
    if (!variants || variants.length === 0) return true;
    return variants.length === 1 && variants[0].name.toLowerCase() === 'default';
  }, [variants]);

  // Extracted colors & sizes if split
  const colors = useMemo(() => {
    if (!canSplitVariants) return [];
    const set = Array.from(new Set(variants.map((v) => v.name.split(' / ')[0].trim())));
    return set.sort((a, b) => {
      const idxA = PREFERRED_COLOR_ORDER.indexOf(a);
      const idxB = PREFERRED_COLOR_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }, [canSplitVariants, variants]);

  const sizes = useMemo(() => {
    if (!canSplitVariants) return [];
    const set = Array.from(new Set(variants.map((v) => v.name.split(' / ')[1].trim())));
    return set.sort((a, b) => {
      const idxA = STANDARD_SIZE_ORDER.indexOf(a);
      const idxB = STANDARD_SIZE_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [canSplitVariants, variants]);

  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);

  // Initialize selected variant: default to first in-stock combination (e.g. Red / XS)
  useEffect(() => {
    if (variants.length > 0) {
      const requested=variants.find(v=>v.id===Number(route.params?.variantId));
      if(requested){if(canSplitVariants){const [color,size]=requested.name.split(' / ');setSelectedColor(color);setSelectedSize(size);}else setSelectedVariantId(requested.id);return;}

      if (canSplitVariants && colors.length > 0 && sizes.length > 0) {
        let foundC = colors[0];
        let foundS = sizes[0];
        let found = false;
        for (const c of colors) {
          for (const s of sizes) {
            const match = variants.find((v) => v.name === `${c} / ${s}`);
            if (match && match.stock > 0) {
              foundC = c;
              foundS = s;
              found = true;
              break;
            }
          }
          if (found) break;
        }
        setSelectedColor(foundC);
        setSelectedSize(foundS);
      } else {
        const firstInStock = variants.find((v) => v.stock > 0) || variants[0];
        setSelectedVariantId(firstInStock.id);
      }
    }
  }, [variants, canSplitVariants, colors, sizes]);

  // Derive active variant
  const activeVariant = useMemo(() => {
    if (!variants || variants.length === 0) return null;
    if (canSplitVariants && selectedColor && selectedSize) {
      const match = variants.find((v) => v.name === `${selectedColor} / ${selectedSize}`);
      return match || null;
    }
    if (selectedVariantId) {
      return variants.find((v) => v.id === selectedVariantId) || variants[0];
    }
    return variants[0];
  }, [variants, canSplitVariants, selectedColor, selectedSize, selectedVariantId]);

  const optionLabels: string[] = product?.optionLabels?.length
    ? product.optionLabels : (Array.isArray(productMetadata.optionLabels) ? productMetadata.optionLabels : ['Màu sắc', 'Kích cỡ']);
  const variantImageMap = product?.variantImages || productMetadata.variantImages as Record<string, string[]> | undefined;
  const colorOptions = useMemo(() => {
    if (!variantImageMap) return [];
    const candidates = canSplitVariants ? colors : variants.map((variant) => variant.name);
    return candidates.filter((value) => !!variantImageMap[value]?.length);
  }, [variantImageMap, canSplitVariants, colors, variants]);
  const selectedVisualOption = canSplitVariants ? selectedColor : activeVariant?.name;

  // Carousel images
  const images = useMemo(() => {
    if (!product) return [];
    const imageKey = canSplitVariants ? selectedColor : activeVariant?.name;
    if (imageKey && variantImageMap?.[imageKey]?.length) return variantImageMap[imageKey];
    if (product.images && product.images.length > 0) return product.images;
    if (product.thumbnailUrl) return [product.thumbnailUrl];
    return [];
  }, [product, variantImageMap, canSplitVariants, selectedColor, activeVariant]);

  useEffect(() => {
    setCurrentImageIndex(0);
    carouselRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [images]);

  const selectImageVariant = (value: string) => {
    if (canSplitVariants) {
      setSelectedColor(value);
      const available = variants.find((variant) => variant.name.startsWith(`${value} / `) && variant.stock > 0);
      if (available) setSelectedSize(available.name.split(' / ')[1]);
    } else {
      const variant = variants.find((item) => item.name === value);
      if (variant) setSelectedVariantId(variant.id);
    }
    setCurrentImageIndex(0);
    carouselRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  // Calculated discount percentage: Math.round((1 - price / originalPrice) * 100)
  const discountPercent = useMemo(() => {
    const base=listingOffer.data?.basePrice??product?.originalPrice??product?.price??0;
    const price=listingOffer.data?.shopPrice??product?.price??0;
    return base>price?Math.round((1-price/base)*100):0;
  }, [product,listingOffer.data]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0 && viewableItems[0].index !== undefined) {
      setCurrentImageIndex(viewableItems[0].index);
    }
  }).current;

  const currentStock = activeVariant ? activeVariant.stock : (variants.length ? 0 : (product?.stock ?? 0));
  useEffect(()=>{setQuantity(q=>currentStock>0?Math.min(Math.max(1,q),currentStock):1);},[currentStock]);

  const handleAddToCartClick = () => setPurchaseMode('cart');
  const handleBuyNowClick = () => setPurchaseMode('buy');

  // State 1: Skeleton Loading
  if (isProductLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={{ width: carouselSize, height: carouselSize, alignSelf: 'center' }}>
          <Skeleton width="100%" height="100%" />
        </View>
        <View style={{ padding: spacing.md }}>
          <Skeleton width="40%" height={28} style={{ marginBottom: spacing.sm }} />
          <Skeleton width="85%" height={22} style={{ marginBottom: spacing.xs }} />
          <Skeleton width="60%" height={22} style={{ marginBottom: spacing.md }} />
          <Skeleton width="100%" height={80} borderRadius={radius.md} />
        </View>
      </SafeAreaView>
    );
  }

  // State 2: Error State
  if (isProductError || !product) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.danger} />
        <Typography variant="lg" weight="bold" style={{ marginTop: spacing.md }}>
          Không thể tải thông tin sản phẩm
        </Typography>
        <Typography variant="sm" color="muted" align="center" style={{ marginHorizontal: spacing.xl, marginTop: spacing.xs }}>
          Đã có lỗi xảy ra hoặc sản phẩm không tồn tại.
        </Typography>
        <Button
          title="Thử lại"
          variant="primary"
          style={{ marginTop: spacing.lg, minWidth: 150 }}
          onPress={() => refetchProduct()}
        />
        <Button
          title="Quay lại"
          variant="outline"
          style={{ marginTop: spacing.sm, minWidth: 150 }}
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main', {screen:'Home'})}
        />
      </SafeAreaView>
    );
  }

  const formatPrice = (val: number) => formatVND(val);
  const description = product.description || 'Shop chưa cập nhật mô tả.';
  const isLongDesc = description.length > 160;
  const displayedDesc = isLongDesc && !isDescExpanded ? `${description.slice(0, 160)}...` : description;

  const flashCampaign=promotionCatalog.data?.campaigns.find(c=>c.kind==='FLASH'&&c.status==='ACTIVE'&&new Date(c.startsAt).getTime()<=promotionClock.now&&new Date(c.endsAt).getTime()>promotionClock.now&&c.items?.some(i=>i.sku_id===activeVariant?.id&&i.remaining>=quantity&&i.userRemaining>=quantity));
  const flashItem=flashCampaign?.items?.find(i=>i.sku_id===activeVariant?.id);
  const currentPrice = listingOffer.data?.afterVoucher ?? flashItem?.sale_price ?? product.price;

  return (
    <View style={styles.container}>
      {/* Main vertical ScrollView wrapping the entire page */}
      <ScrollView



        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Image Carousel (Fixed ratio 1:1, max 480px on web) */}
        <View style={[styles.carouselContainer, { width: carouselSize, height: carouselSize }]}>
          <FlatList
            ref={carouselRef}
            key={`${product.id}-${selectedVisualOption || 'gallery'}`}
            data={images.length > 0 ? images : [null]}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            style={{ width: carouselSize, height: carouselSize }}
            renderItem={({ item }) => (
              <View style={{ width: carouselSize, height: carouselSize }}>
                <RemoteImage
                  sourceUrl={item}
                  name={product.name}
                  style={{ width: carouselSize, height: carouselSize }}
                  resizeMode="cover"
                  iconSize={48}
                />
              </View>
            )}
          />

          {/* 1/N Counter */}
          {images.length > 1 && (
            <View style={styles.imageCounter}>
              <Typography variant="xs" color="surface" weight="bold">
                {currentImageIndex + 1}/{images.length}
              </Typography>
            </View>
          )}

          {/* Floating Headers (Back & Cart buttons) */}
          <SafeAreaView style={styles.floatingHeader}>
            <TouchableOpacity
              style={styles.floatingBtn}
              activeOpacity={0.8}
              onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Main', {screen:'Home'})}
            >
              <Ionicons name="arrow-back" size={22} color={COLORS.surface} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.floatingBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Cart')}
            >
              <Ionicons name="cart-outline" size={22} color={COLORS.surface} />
              {cartData && cartData.totalItems > 0 && (
                <View style={styles.cartBadge}>
                  <Typography variant="xs" color="surface" style={{ fontSize: 10, fontWeight: '700' }}>
                    {cartData.totalItems > 99 ? '99+' : cartData.totalItems}
                  </Typography>
                </View>
              )}
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {images.length>1&&<View style={{padding:12,backgroundColor:COLORS.surface,gap:8}}><Typography variant="xs" color="inkSoft">{images.length} ảnh sản phẩm · Chạm để xem</Typography><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}>{images.map((url,index)=><TouchableOpacity key={`${index}-${url}`} accessibilityRole="button" accessibilityLabel={`Xem ảnh ${index+1}`} onPress={()=>{carouselRef.current?.scrollToOffset({offset:index*carouselSize,animated:true});setCurrentImageIndex(index);}} style={{borderWidth:2,borderColor:index===currentImageIndex?COLORS.primaryDeep:COLORS.border,borderRadius:8,overflow:'hidden'}}><RemoteImage sourceUrl={url} name={product.name} style={{width:52,height:52}}/></TouchableOpacity>)}</ScrollView></View>}
        {flashItem&&<View style={[styles.section,{backgroundColor:COLORS.primarySoft}]}><Typography weight="bold" color="deal">Flash sale · {flashItem.remaining} suất còn lại</Typography><Typography variant="sm">Tối đa {flashItem.per_user_limit} sản phẩm/khách. Giá cuối và lượt còn lại được kiểm tra lại khi xác nhận đơn.</Typography></View>}
        {/* Section: Price & Title & Stats */}
        <View style={styles.section}>
          <View style={styles.priceRow}>
            <Typography variant="xxl" weight="bold" color="deal">
              {formatPrice(currentPrice)}
            </Typography><Typography variant="xs" color="primaryDeep">Giá sau voucher · phân loại rẻ nhất</Typography>
            {null}
            {discountPercent > 0 && (
              <Badge label={`-${discountPercent}%`} variant="danger" style={{ marginLeft: spacing.sm }} />
            )}
          </View>

          <Typography variant="lg" weight="semiBold" role="heading" aria-level={1} numberOfLines={1} ellipsizeMode="tail" style={styles.productName}>
            {product.name}
          </Typography>

          <View style={styles.statsRow}>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={15} color={COLORS.star} />
              <Typography variant="sm" weight="bold" style={{ marginLeft: 4 }}>
                {product.rating ? Number(product.rating).toFixed(1) : '0.0'}
              </Typography>
              <Typography variant="sm" color="muted" style={{ marginLeft: 4 }}>
                ({product.ratingCount || 0} đánh giá)
              </Typography>
            </View>
            <View style={styles.statsDivider} />
            <Typography variant="sm" color="muted">
              {formatSoldVi(product.soldCount)}
            </Typography>
            <View style={styles.statsDivider} />
            <Typography variant="sm" color="muted">
              Kho: {product.stock || 0}
            </Typography>
          </View>

          <View style={{flexDirection:'row',alignItems:'center',gap:8,paddingTop:12,marginTop:10,borderTopWidth:1,borderColor:COLORS.border}}><Ionicons name="location-outline" size={18} color={COLORS.primaryDeep}/><Typography variant="sm" color="inkSoft">{provinceLabel(product.shopLocation)||'Xem thông tin giao hàng tại shop'}</Typography></View>
        </View>

        {/* Section: Shop Information */}
        <View style={styles.shopInfoSection}>
          <View style={styles.shopAvatarCircle}>
            <Ionicons name="storefront" size={22} color={COLORS.primaryDeep} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Typography variant="sm" weight="bold" color="ink">
              {product.shopName || 'Cửa hàng'}
            </Typography>
            <Typography variant="xs" color="inkSoft" style={{ marginTop: 2 }}>
              {provinceLabel(product.shopLocation) || 'Xem thông tin và đánh giá shop'}
            </Typography>
          </View>
          <TouchableOpacity style={styles.viewShopButton} activeOpacity={0.7} disabled={!product.shopId} onPress={() => product.shopId && navigation.push('Shop', { shopId: product.shopId })}>
            <Typography variant="xs" weight="bold" style={{ color: COLORS.primaryDeep }}>
              Xem Shop
            </Typography>
          </TouchableOpacity>
          {canEditProduct && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Sửa sản phẩm" style={[styles.viewShopButton,{marginLeft:8}]} onPress={()=>navigation.navigate('SellerCenter',{editProductId:product.id})}>
            <Ionicons name="create-outline" size={18} color={COLORS.primaryDeep}/>
          </TouchableOpacity>}
        </View>

        {/* Section: Variant Trigger Row */}
        {null}

        {/* Section: Description */}
        <View style={styles.section}>
          <Typography variant="md" weight="bold" style={{ marginBottom: spacing.xs }}>
            Mô tả sản phẩm
          </Typography>
          {Array.isArray(productMetadata.specifications) && productMetadata.specifications.slice(0,12).map((fact: {label:string;value:string},index:number)=><View key={index} style={{flexDirection:'row',paddingVertical:6,gap:12,borderBottomWidth:1,borderBottomColor:COLORS.border}}><Typography variant="xs" color="muted" style={{width:'32%'}}>{fact.label}</Typography><Typography variant="xs" style={{flex:1}}>{fact.value}</Typography></View>)}
          {typeof productMetadata.sourceUrl==='string' && <TouchableOpacity accessibilityRole="link" onPress={()=>Linking.openURL(productMetadata.sourceUrl)} style={{paddingVertical:12}}><Typography variant="xs" color="primaryDeep" weight="semiBold">Xem thông tin từ hãng ↗</Typography></TouchableOpacity>}
          <Typography variant="sm" color="inkSoft" style={styles.descText}>
            {displayedDesc}
          </Typography>
          {isLongDesc && (
            <TouchableOpacity
              onPress={() => setIsDescExpanded(!isDescExpanded)}
              style={styles.seeMoreBtn}
              activeOpacity={0.7}
            >
              <Typography variant="sm" weight="semiBold" color="primaryDeep">
                {isDescExpanded ? 'Thu gọn' : 'Xem thêm'}
              </Typography>
            </TouchableOpacity>
          )}
        </View>

        {/* Section: Product Reviews (Up to 3 latest reviews) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Typography variant="md" weight="bold">
              Đánh giá từ khách hàng ({product.ratingCount || 0})
            </Typography>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Xem tất cả đánh giá" onPress={()=>navigation.navigate('Reviews',{productId:product.id})} activeOpacity={0.7} style={styles.seeAllBtn}>
              <Typography variant="sm" color="primaryDeep" weight="semiBold">
                Xem tất cả
              </Typography>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primaryDeep} />
            </TouchableOpacity>
          </View>

          {isLoadingReviews ? (
            <ActivityIndicator size="small" color={COLORS.primaryDeep} style={{ marginVertical: spacing.md }} />
          ) : reviewsData && reviewsData.length > 0 ? (
            reviewsData.slice(0, 3).map((review: ReviewResponse, idx: number) => {
              const name = review.userFullName || 'Anonymous';
              const initial = name.charAt(0).toUpperCase();
              const avatarColor = getAvatarPastel(name);
              const emotionSymbol = review.emotion ? EMOTION_ICONS[review.emotion] : null;
              const timeAgo = formatTimeAgo(review.createdAt);

              return (
                <View key={review.id || idx} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    {/* Pastel Avatar with User initial */}
                    <View style={[styles.reviewAvatar, { backgroundColor: avatarColor }]}>
                      <Typography variant="sm" weight="bold" color="primaryDeep">
                        {initial}
                      </Typography>
                    </View>
                    <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="sm" weight="bold" color="ink">
                          {name}
                        </Typography>
                        <Typography variant="xs" color="muted">
                          {timeAgo}
                        </Typography>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= review.rating ? 'star' : 'star-outline'}
                            size={12}
                            color={COLORS.star}
                            style={{ marginRight: 2 }}
                          />
                        ))}
                        {emotionSymbol && (
                          <Typography variant="sm" style={{ marginLeft: spacing.xs }}>
                            {emotionSymbol}
                          </Typography>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Comment (hidden if empty) */}
                  {!!review.comment && (
                    <Typography variant="sm" color="inkSoft" style={{ marginTop: spacing.xs, lineHeight: 20 }}>
                      {review.comment}
                    </Typography>
                  )}

                  {/* Tags as pastel chips */}
                  {review.tags && review.tags.length > 0 && (
                    <View style={styles.reviewTagsRow}>
                      {review.tags.map((tag: string, tIdx: number) => (
                        <View key={tIdx} style={styles.reviewTagChip}>
                          <Typography variant="xs" weight="medium" color="primaryDeep">
                            {TAG_NAMES[tag] || tag}
                          </Typography>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Images (hidden if empty) */}
                  {review.imageUrls && review.imageUrls.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
                      {review.imageUrls.map((url: string, i: number) => (
                        <RemoteImage
                          key={i}
                          sourceUrl={url}
                          name={`Review ${i}`}
                          style={styles.reviewImage}
                          iconSize={24}
                        />
                      ))}
                    </ScrollView>
                  )}
                </View>
              );
            })
          ) : (
            <Typography variant="sm" color="muted" style={{ marginVertical: spacing.sm }}>
              Chưa có đánh giá nào cho sản phẩm này.
            </Typography>
          )}
        </View>

        {/* Section: Related Products */}
        {relatedProducts.length > 0 && (
          <View style={styles.relatedSection}>
            <Typography variant="md" weight="bold" style={styles.relatedTitle}>
              Có thể bạn cũng thích
            </Typography>
            <View style={styles.relatedGrid}>
              {relatedProducts.map((p: ProductListResponse) => (
                <View key={p.id} style={{ width: '48%', marginBottom: spacing.md }}>
                  <ProductCard
                    id={p.id}
                    name={p.name}
                    price={p.price}
                    originalPrice={p.originalPrice}
                    thumbnailUrl={p.thumbnailUrl}
                    rating={p.rating}
                    soldCount={p.soldCount}
                    onPress={() => navigation.push('ProductDetail', { productId: p.id })}
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Bar: Cart button + Add to Cart button (soft) + Buy Now button (primary) */}
      <SafeAreaView   style={styles.bottomBarContainer}>
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.cartBarBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Cart')}
          >
            <Ionicons name="cart-outline" size={24} color={COLORS.primaryDeep} />
            {cartData && cartData.totalItems > 0 && (
              <View style={styles.cartBarBadge}>
                <Typography variant="xs" color="surface" style={{ fontSize: 9, fontWeight: '700' }}>
                  {cartData.totalItems > 99 ? '99+' : cartData.totalItems}
                </Typography>
              </View>
            )}
          </TouchableOpacity>

          <Button
            title={currentStock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
            variant="soft"
            disabled={currentStock <= 0}
            style={[styles.bottomActionBtn, { marginRight: spacing.sm }]}
            onPress={handleAddToCartClick}
          />

          <Button
            title={currentStock <= 0 ? 'Hết hàng' : 'Mua ngay'}
            variant="primary"
            disabled={currentStock <= 0}
            style={styles.bottomActionBtn}
            onPress={handleBuyNowClick}
          />
        </View>
      <PurchaseSelector key={purchaseMode??'closed'} productId={Number(productId)} mode={purchaseMode} onClose={()=>setPurchaseMode(null)}/></SafeAreaView>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  scrollContent: {
    paddingBottom: 120, // Tab bar / Bottom bar spacing
  },
  carouselContainer: {
    alignSelf: 'center',
    backgroundColor: COLORS.surfaceAlt,
    position: 'relative',
    overflow: 'hidden',
  },
  imageCounter: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  floatingHeader: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 28 : 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    zIndex: 10,
  },
  floatingBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.danger,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: COLORS.surface,
  },
  section: {
    backgroundColor: COLORS.surface,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    marginLeft: spacing.sm,
  },
  productName: {
    marginBottom: spacing.sm,
    lineHeight: 26,
  },
  colorOptionsSection: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  colorOptionsTitle: {
    marginBottom: spacing.xs,
    color: COLORS.ink,
  },
  colorOptionsList: {
    alignItems: 'center',
    paddingVertical: 2,
    paddingRight: spacing.sm,
  },
  colorOptionButton: {
    width: 58,
    height: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 3,
    marginRight: spacing.sm,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  colorOptionButtonSelected: {
    borderWidth: 2,
    borderColor: COLORS.primaryDeep,
  },
  colorOptionImage: {
    width: '100%',
    height: '100%',
    borderRadius: radius.sm,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsDivider: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.border,
    marginHorizontal: spacing.sm,
  },
  shopInfoSection: {
    backgroundColor: COLORS.surface,
    padding: spacing.md,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  shopAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewShopButton: {
    borderWidth: 1,
    borderColor: COLORS.primaryDeep,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sectionRow: {
    backgroundColor: COLORS.surface,
    padding: spacing.md,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  descText: {
    lineHeight: 22,
    marginTop: 4,
  },
  seeMoreBtn: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceAlt,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  reviewComment: {
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  reviewTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  reviewTagChip: {
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginRight: spacing.xs,
    marginTop: 4,
  },
  reviewImage: {
    width: 94,
    height: 94,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  relatedSection: {
    paddingTop: spacing.md,
  },
  relatedTitle: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  relatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: spacing.sm,
    height: 68,
  },
  cartBarBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: COLORS.primaryDeep,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  cartBarBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  bottomActionBtn: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 6,
    height: 48,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)', // Semi-transparent overlay so product page is visible behind
    justifyContent: 'flex-end',
  },
  backdropDismiss: {
    flex: 1,
  },
  bottomSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '88%',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sheetImage: {
    width: 94,
    height: 94,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  sheetHeaderInfo: {
    flex: 1,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  sheetBody: {
    marginVertical: spacing.xs,
  },
  sheetOptionGroup: {
    marginBottom: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  variantChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    minHeight: 42,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: COLORS.surface,
  },
  variantChipActive: {
    borderColor: COLORS.primaryDeep,
    backgroundColor: COLORS.primarySoft,
  },
  variantChipDisabled: {
    opacity: 0.35,
    backgroundColor: COLORS.surfaceAlt,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceAlt,
  },
  quantityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: radius.md,
  },
  qtyBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  qtyBtnDisabled: {
    opacity: 0.35,
  },
  qtyText: {
    paddingHorizontal: spacing.md,
  },
  sheetFooter: {
    marginTop: spacing.md,
  },
});
