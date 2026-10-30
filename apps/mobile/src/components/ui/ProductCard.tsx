import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, radius, spacing, shadows } from '../../theme';
import { Typography } from './Typography';
import { Badge } from './Badge';
import { Ionicons } from '@expo/vector-icons';
import { RemoteImage } from './RemoteImage';
import { formatVND, formatSoldVi, calculateShippingTime } from '../../utils/formatters';
import { STRINGS } from '../../constants/strings';

export interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  thumbnailUrl?: string | null;
  rating?: number;
  soldCount?: number;
  shopName?: string;
  shopLocation?: string;
  compact?: boolean;
  isShopOwner?: boolean;
  isCheapest?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({
  name,
  price,
  originalPrice,
  thumbnailUrl,
  rating,
  soldCount,
  shopLocation = 'TP. Hồ Chí Minh',
  compact = false,
  isShopOwner = false,
  isCheapest = false,
  onPress,
  onEdit,
  onDelete,
}) => {
  const discountPercent =
    originalPrice && originalPrice > price
      ? Math.round((1 - price / originalPrice) * 100)
      : 0;

  const { timeText, isExpress } = calculateShippingTime(shopLocation);

  return (
    <TouchableOpacity
      style={[styles.container, shadows.sm]}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${formatVND(price)}`}
      activeOpacity={0.9}
      onPress={onPress}
    >
      {/* Product Image Box */}
      <View style={[styles.imageContainer, compact && {aspectRatio:1.15}]}>
        <RemoteImage
          sourceUrl={thumbnailUrl}
          name={name}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Freeship Badge Top-Right */}

        {/* Discount Badge Top-Left */}
        {discountPercent > 0 && (
          <View style={styles.discountBadge}>
            <Typography variant="xs" weight="bold" color="surface">-{discountPercent}%</Typography>
          </View>
        )}

        {/* Seller Quick Action Overlay */}
        {isShopOwner && (
          <View style={styles.sellerActionOverlay}>
            <TouchableOpacity
              style={[styles.sellerBtn, { backgroundColor: COLORS.primarySoft }]}
              accessibilityRole="button"
              accessibilityLabel={`Sửa ${name}`}
              onPress={(e) => {
                e.stopPropagation?.();
                onEdit?.();
              }}
            >
              <Ionicons name="create-outline" size={14} color={COLORS.primaryDeep} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sellerBtn, { backgroundColor: COLORS.dangerSoft, marginLeft: 4 }]}
              accessibilityRole="button"
              accessibilityLabel={`Xóa ${name}`}
              onPress={(e) => {
                e.stopPropagation?.();
                onDelete?.();
              }}
            >
              <Ionicons name="trash-outline" size={14} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Card Content Body */}
      <View style={[styles.content, compact && {paddingVertical:6}]}>
        {/* Name with 2 lines max */}
        <Typography variant="sm" weight="medium" numberOfLines={2} style={styles.title}>
          {name}
        </Typography>

        {/* Promotional Tags */}
        {isCheapest && (
          <View style={styles.promoTagRow}>
            <View style={styles.cheapestBadge}>
              <Ionicons name="thumbs-up" size={10} color="#E53E3E" style={{ marginRight: 2 }} />
              <Typography variant="xs" weight="bold" style={styles.cheapestText}>
                Rẻ Vô Địch
              </Typography>
            </View>
          </View>
        )}

        {/* Price Row: VNĐ formatted */}
        <View style={styles.priceContainer}>
          <Typography variant="md" weight="bold" style={styles.priceText}>
            {formatVND(price)}
          </Typography>
          {originalPrice && originalPrice > price && (
            <Typography variant="xs" color="muted" style={styles.originalPrice}>
              {formatVND(originalPrice)}
            </Typography>
          )}
        </View>
        {!compact && originalPrice && originalPrice > price ? (
          <Typography variant="xs" weight="medium" color="deal" numberOfLines={1} style={styles.savingText}>
            {STRINGS.SAVING} {formatVND(originalPrice - price)}
          </Typography>
        ) : null}

        {/* Rating and Sold count in Vietnamese */}
        <View style={styles.ratingSoldRow}>
          {rating !== undefined && rating > 0 && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={11} color={COLORS.star} />
              <Typography variant="xs" weight="bold" color="ink" style={styles.ratingText}>
                {rating.toFixed(1)}
              </Typography>
            </View>
          )}
          <Typography variant="xs" color="muted" numberOfLines={1} style={{ flex: 1, textAlign: 'right' }}>
            {formatSoldVi(soldCount)}
          </Typography>
        </View>

        {/* Delivery Time & Shop Location Row */}
        {!compact && <View style={styles.shippingRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Ionicons
              name="car-outline"
              size={12}
              color={isExpress ? '#2F855A' : COLORS.inkSoft}
              style={{ marginRight: 3 }}
            />
            <Typography
              variant="xs"
              style={[styles.shippingText, isExpress && { color: '#2F855A', fontWeight: '600' }]}
              numberOfLines={1}
            >
              {timeText}
            </Typography>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="location-outline" size={11} color={COLORS.muted} style={{ marginRight: 2 }} />
            <Typography variant="xs" color="muted" style={styles.locationText} numberOfLines={1}>
              {shopLocation}
            </Typography>
          </View>
        </View>}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: 0,
    borderWidth: 1.25,
    borderColor: COLORS.border,
    padding: 6,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 11,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  freeshipBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#00B4D8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  freeshipText: {
    color: '#FFFFFF',
    fontSize: 9,
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.deal,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  sellerActionOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
  },
  sellerBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  content: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  title: {
    minHeight: 40,
    lineHeight: 20,
    marginBottom: 6,
    color: COLORS.ink,
  },
  promoTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  cheapestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerSoft,
    borderWidth: 0,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  cheapestText: {
    color: COLORS.danger,
    fontSize: 11,
  },
  priceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  priceText: {
    color: COLORS.deal,
    fontSize: 18,
    lineHeight: 26,
  },
  savingText: { fontSize: 11, lineHeight: 17, marginBottom: 6 },
  originalPrice: {
    marginLeft: 0,
    textDecorationLine: 'line-through',
    fontSize: 12,
  },
  ratingSoldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 3,
    fontSize: 12,
  },
  shippingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  shippingText: {
    fontSize: 11,
    color: COLORS.inkSoft,
  },
  locationText: {
    fontSize: 11,
  },
});
