import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  View,
  Platform,
} from 'react-native';
import { COLORS, radius, spacing, typography } from '../../theme';
import { Typography } from './Typography';

export type ButtonVariant = 'primary' | 'soft' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  title?: string;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  title,
  loading = false,
  fullWidth = false,
  disabled,
  leftIcon,
  rightIcon,
  style,
  children,
  ...props
}) => {
  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: COLORS.primaryDeep, borderColor: COLORS.primaryDeep };
      case 'soft':
        return { backgroundColor: COLORS.primarySoft, borderColor: COLORS.primarySoft };
      case 'secondary':
        return { backgroundColor: COLORS.lilac, borderColor: COLORS.lilac };
      case 'outline':
        return { backgroundColor: 'transparent', borderColor: COLORS.primary, borderWidth: 1 };
      case 'ghost':
        return { backgroundColor: 'transparent', borderColor: 'transparent' };
      default:
        return {};
    }
  };

  const getTextColor = (): string => {
    if (disabled) return COLORS.muted;
    switch (variant) {
      case 'primary': return COLORS.surface;
      case 'soft': return COLORS.ink;
      case 'secondary': return COLORS.primaryDeep;
      case 'outline': return COLORS.primaryDeep;
      case 'ghost': return COLORS.ink;
      default: return COLORS.surface;
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm': return { paddingHorizontal: spacing.md, height: 36 };
      case 'lg': return { paddingHorizontal: spacing.xl, height: 52 };
      case 'md':
      default: return { paddingHorizontal: spacing.lg, height: 44 };
    }
  };

  const typographyVariant = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled || loading}
      style={[
        styles.base,
        getVariantStyles(),
        getSizeStyles(),
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          {title ? (
            <Typography variant={typographyVariant} weight="semiBold" color={getTextColor()}>
              {title}
            </Typography>
          ) : typeof children === 'string' ? (
            <Typography variant={typographyVariant} weight="semiBold" color={getTextColor()}>
              {children}
            </Typography>
          ) : (
            children
          )}
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
});

