import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

/**
 * The web fallback in bottom-tabs keeps previously visited scenes mounted.
 * Transparent scenes therefore need an explicit visibility boundary: stacking
 * order and pointerEvents alone do not prevent inactive content showing through.
 * Keep children mounted so search fields, list positions and queries survive.
 */
export function TabScene({ name, children }: { name: string; children: React.ReactNode }) {
  const focused = useIsFocused();

  if (Platform.OS !== 'web') return <>{children}</>;

  return (
    <View
      testID={`tab-scene-${name}`}
      aria-hidden={!focused}
      pointerEvents={focused ? 'auto' : 'none'}
      style={[styles.scene, !focused && styles.hidden]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { flex: 1 },
  hidden: { display: 'none' },
});
