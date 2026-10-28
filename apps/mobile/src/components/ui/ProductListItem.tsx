import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS, radius, spacing, shadows } from '../../theme';
import { Typography } from './Typography';
import { Badge } from './Badge';
import { Ionicons } from '@expo/vector-icons';
import { ProductCardProps } from './ProductCard';
import { RemoteImage } from './RemoteImage';
import { formatVND, formatSoldVi } from '../../utils/formatters';

export const ProductListItem: React.FC<ProductCardProps> = React.memo(({
  id,
  name,
  price,
  originalPrice,
  thumbnailUrl,
  rating,
  soldCount,
  onPress,
}) => {
  const formatPrice = (value: number) => formatVND(value);

  const discountPercent = originalPrice && originalPrice > price
    ? Math.round((1 - price / originalPrice) * 100)
    : 0;

  return (
    <TouchableOpacity
      style={[styles.container, shadows.sm]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        <RemoteImage
          sourceUrl={thumbnailUrl}
          name={name}
          style={styles.image}
          resizeMode="cover"
        />
        {discountPercent > 0 && (
          <Badge
            label={`-${discountPercent}%`}
            variant="danger"
            style={styles.discountBadge}
          />
        )}
      </View>
      <View style={styles.content}>
        <Typography variant="sm" weight="medium" numberOfLines={2} style={styles.title}>
          {name}
        </Typography>
        
        <View style={styles.priceContainer}>
          <Typography variant="lg" weight="bold" color="primaryDeep">
            {formatPrice(price)}
          </Typography>
          {originalPrice && originalPrice > price && (
            <Typography variant="sm" color="muted" style={styles.originalPrice}>
              {formatPrice(originalPrice)}
            </Typography>
          )}
        </View>

        <View style={styles.footer}>
          {rating !== undefined && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color={COLORS.star} />
              <Typography variant="sm" color="inkSoft" style={styles.ratingText}>
                {rating.toFixed(1)}
              </Typography>
            </View>
          )}
          {soldCount !== undefined && (
            <Typography variant="sm" color="muted">
              {formatSoldVi(soldCount)}
            </Typography>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: radius.lg,
    borderWidth: 1.25,
    borderColor: COLORS.border,
    overflow: 'hidden',
    flexDirection: 'row',
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  imageContainer: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
  },
  content: {
    flex: 1,
    paddingLeft: spacing.md,
    justifyContent: 'space-between',
  },
  title: {
    marginBottom: spacing.xs,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    marginLeft: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
  },
});
