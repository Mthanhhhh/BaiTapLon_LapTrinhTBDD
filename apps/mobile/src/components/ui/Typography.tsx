import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { COLORS, typography } from '../../theme';

type TypographyVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl';
type TypographyWeight = 'regular' | 'medium' | 'semiBold' | 'bold';
type TypographyColor = keyof typeof COLORS;

export interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  weight?: TypographyWeight;
  color?: TypographyColor | string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'md',
  weight = 'regular',
  color = 'ink',
  align = 'left',
  style,
  children,
  ...props
}) => {
  const textColor = (COLORS as Record<string, string>)[color] || color;
  
  return (
    <Text
      style={[
        {
          fontFamily: typography.fontFamily[weight],
          fontSize: typography.fontSize[variant],
          lineHeight: typography.lineHeight[variant],
          color: textColor,
          textAlign: align,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

