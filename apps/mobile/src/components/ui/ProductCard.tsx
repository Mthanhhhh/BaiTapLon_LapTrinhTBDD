import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS, radius, spacing, shadows } from '../../theme';
import { Typography } from './Typography';
import { Badge } from './Badge';
import { Ionicons } from '@expo/vector-icons';

export interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  thumbnailUrl?: string | null;
  rating?: number;
  soldCount?: number;
  onPress?: () => void;
}

import { RemoteImage } from './RemoteImage';

export const ProductCard: React.FC<ProductCardProps> = React.memo(({
  name,
  price,
  originalPrice,
  thumbnailUrl,
  rating,
  soldCount,
  onPress,
}) => {
  const formatPrice = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

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
          <Typography variant="md" weight="bold" color="primaryDeep">
            {formatPrice(price)}
          </Typography>
          {originalPrice && originalPrice > price && (
            <Typography variant="xs" color="muted" style={styles.originalPrice}>
              {formatPrice(originalPrice)}
            </Typography>
          )}
        </View>

        <View style={styles.footer}>
          {rating !== undefined && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color={COLORS.star} />
              <Typography variant="xs" color="inkSoft" style={styles.ratingText}>
                {rating.toFixed(1)}
              </Typography>
            </View>
          )}
          {soldCount !== undefined && (
            <Typography variant="xs" color="muted">
              {soldCount} sold
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
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.surfaceAlt,
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
    right: spacing.xs,
  },
  content: {
    padding: spacing.sm,
  },
  title: {
    marginBottom: spacing.xs,
    minHeight: 40, // To keep grid aligned if title is 1 or 2 lines
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    marginLeft: spacing.xs,
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
    marginLeft: 2,
  },
});

