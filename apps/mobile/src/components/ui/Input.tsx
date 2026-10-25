import React, { useState } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { COLORS, radius, spacing, typography } from '../../theme';
import { Typography } from './Typography';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'input-autofill-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      input:-webkit-autofill,
      input:-webkit-autofill:focus {
        -webkit-box-shadow: 0 0 0 1000px #F1EEFB inset !important;
        -webkit-text-fill-color: #2B2D42 !important;
        caret-color: #2B2D42;
        border-radius: 16px;
        transition: background-color 9999s ease-in-out 0s;
      }
      .custom-input {
        outline: none;
      }
    `;
    document.head.appendChild(style);
  }
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <Typography variant="sm" weight="medium" color="inkSoft" style={styles.label}>
          {label}
        </Typography>
      )}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focused,
          error && styles.error,
          style,
        ]}
      >
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon ? { paddingLeft: 0 } : {}]}
          placeholderTextColor={COLORS.muted}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          // @ts-ignore for web specific className
          className={Platform.OS === 'web' ? 'custom-input' : ''}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity
            style={styles.iconContainerRight}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Typography variant="xs" color="danger" style={styles.errorText}>
          {error}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: radius.lg,
    backgroundColor: COLORS.surface,
    minHeight: 48,
    overflow: 'hidden', // Ensures inner text input doesn't spill over the rounded corners
  },
  focused: {
    borderColor: COLORS.primary,
  },
  error: {
    borderColor: COLORS.danger,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.md,
    color: COLORS.ink,
    minHeight: 48,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' && { outlineStyle: 'none' } as any),
  },
  iconContainer: {
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerRight: {
    paddingRight: spacing.md,
    paddingLeft: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: spacing.xs,
  },
});
