import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, radius, spacing } from '../../theme';
import { Typography } from './Typography';

export type BadgeVariant = 'primary' | 'danger' | 'success' | 'warning' | 'default';

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'default', style }) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return COLORS.primarySoft;
      case 'danger': return COLORS.dangerSoft;
      case 'success': return COLORS.mint;
      case 'warning': return COLORS.lemon;
      case 'default':
      default: return COLORS.surfaceAlt;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary': return COLORS.primaryDeep;
      case 'danger': return COLORS.danger;
      case 'success': return COLORS.mintDeep;
      case 'warning': return COLORS.star;
      case 'default':
      default: return COLORS.inkSoft;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor() }, style]}>
      <Typography variant="xs" weight="semiBold" color={getTextColor()}>
        {label}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
});

