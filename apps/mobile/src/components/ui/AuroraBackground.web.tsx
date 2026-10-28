import React from 'react';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '../../theme';

// The animated pastel backdrop is shared by the app root, behind this content.
export type AuroraPalette = 'calm' | 'candy';
export type AuroraVariant = 'full' | 'header';
export type AuroraIntensity = 'soft' | 'normal';
export interface AuroraBackgroundProps {
  palette?: AuroraPalette;
  variant?: AuroraVariant;
  intensity?: AuroraIntensity;
  paused?: boolean;
  headerHeight?: number;
  children?: React.ReactNode;
}
export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({ variant = 'full', headerHeight = 220, children }) => (
  <View style={[styles.surface, variant === 'full' ? styles.full : { minHeight: headerHeight }]}>{children}</View>
);
const styles = StyleSheet.create({
  surface: { backgroundColor: 'transparent', overflow: 'hidden', width: '100%' },
  full: { flex: 1 },
});
