import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Easing, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useContentWidth } from '../../hooks/useContentWidth';
import { COLORS } from '../../theme';
import { PASTEL_BAND, PASTEL_HAZE, PASTEL_TRAVEL_MS } from './pastelMotion';

export function WaveBackdrop() {
  const width = useContentWidth();
  const drift = useRef(new Animated.Value(0)).current;
  const haze = useRef(new Animated.Value(0)).current;
  const [reducedMotion, setReducedMotion] = useState(true);
  const [active, setActive] = useState(AppState.currentState !== 'background');

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReducedMotion(value); });
    const preference = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    const state = AppState.addEventListener('change', value => setActive(value === 'active'));
    return () => { mounted = false; preference.remove(); state.remove(); };
  }, []);

  useEffect(() => {
    if (!active) return;
    const makeLoop = (value: Animated.Value, duration: number) => Animated.loop(Animated.sequence([
      Animated.timing(value, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      Animated.timing(value, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
    ]));
    const factor = reducedMotion ? 2 : 1;
    const motion = makeLoop(drift, PASTEL_TRAVEL_MS * factor);
    const breathing = makeLoop(haze, 13000 * factor);
    motion.start(); breathing.start();
    return () => { motion.stop(); breathing.stop(); };
  }, [active, drift, haze, reducedMotion]);

  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.backdrop}>
      <Animated.View style={{ position: 'absolute', top: '-15%', height: '130%', width: width * 3,
        transform: [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -width * 2] }) }] }}>
        <LinearGradient colors={PASTEL_BAND} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.35 }} style={styles.fill} />
      </Animated.View>
      <Animated.View style={[styles.fill, { opacity: haze.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.5] }) }]}>
        <LinearGradient colors={PASTEL_HAZE} start={{ x: 0, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.fill} />
      </Animated.View>
    </View>
  );
}
const styles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden', backgroundColor: COLORS.bg },
  fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});
