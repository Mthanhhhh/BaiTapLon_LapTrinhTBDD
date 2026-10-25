import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  AppState,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useIsFocused } from '@react-navigation/native';
import { COLORS } from '../../theme';

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

import { useContentWidth } from '../../hooks/useContentWidth';

const PALETTES: Record<AuroraPalette, readonly [string, string, ...string[]]> = {
  calm: ['#BDEBF2', '#C9E2FF', '#DCD3FF', '#F8CFE3', '#DCD3FF', '#C9E2FF', '#BDEBF2'],
  candy: ['#BDEBF2', '#C9E2FF', '#DCD3FF', '#FFD8C2', '#BDEFD9', '#DCD3FF', '#BDEBF2'],
};

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  palette = 'calm',
  variant = 'full',
  intensity = 'normal',
  paused = false,
  headerHeight = 220,
  children,
}) => {
  const contentWidth = useContentWidth();
  const isFocused = useIsFocused();
  const [reduceMotion, setReduceMotion] = useState(false);

  const bandTranslateX = useRef(new Animated.Value(0)).current;
  const wave1TranslateX = useRef(new Animated.Value(0)).current;
  const wave2TranslateX = useRef(new Animated.Value(0)).current;

  const bandWidth = contentWidth * 3;
  const waveWidth = contentWidth * 2;
  const colors = PALETTES[palette];
  const opacityMultiplier = intensity === 'soft' ? 0.8 : 1;
  const height = variant === 'header' ? headerHeight : 800;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    let isActive = true;
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      isActive = nextAppState === 'active';
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (reduceMotion || paused || !isFocused) {
      bandTranslateX.stopAnimation();
      wave1TranslateX.stopAnimation();
      wave2TranslateX.stopAnimation();
      return;
    }

    // Band Sweep (22s)
    Animated.loop(
      Animated.timing(bandTranslateX, {
        toValue: -bandWidth,
        duration: 22000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Wave 1 (Right to Left, 18s)
    Animated.loop(
      Animated.timing(wave1TranslateX, {
        toValue: -waveWidth,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Wave 2 (Left to Right, 28s) - We start from -waveWidth and move to 0
    wave2TranslateX.setValue(-waveWidth);
    Animated.loop(
      Animated.timing(wave2TranslateX, {
        toValue: 0,
        duration: 28000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    return () => {
      bandTranslateX.stopAnimation();
      wave1TranslateX.stopAnimation();
      wave2TranslateX.stopAnimation();
    };
  }, [reduceMotion, paused, isFocused, bandWidth, waveWidth]);

  const containerStyle = [
    styles.container,
    variant === 'header' && { height: headerHeight, overflow: 'hidden' as const },
  ];

  // A generic sine wave path for a width of waveWidth (which is 2 * windowWidth)
  // Wavelength = 1.2 * windowWidth. So across 2 * windowWidth we have ~1.66 waves.
  // We need the start and end of the wave to match perfectly to loop!
  // If waveWidth = 2 * width, and we want it to loop at waveWidth, the wavelength MUST evenly divide waveWidth.
  // So wavelength = waveWidth / 2 = 1.0 * width. 
  // Let's use wavelength = width. So one waveWidth (2 * width) has exactly 2 full sine waves.
  // Amplitude = ~6-8% of height.
  const A = height * 0.08;
  const H = height * 0.4;
  const W = waveWidth; 
  // Path: M 0,H Q W/8,H-A W/4,H T W/2,H T 3W/4,H T W,H L W,height L 0,height Z
  const qx1 = W / 8;
  const qy1 = H - A;
  const x1 = W / 4;
  const x2 = W / 2;
  const x3 = (3 * W) / 4;
  
  const pathData = `M 0,${H} 
    Q ${qx1},${qy1} ${x1},${H} 
    T ${x2},${H} 
    T ${x3},${H} 
    T ${W},${H} 
    L ${W},${height} L 0,${height} Z`;

  const wave2H = height * 0.65;
  const wave2qy1 = wave2H + A;
  const path2Data = `M 0,${wave2H} 
    Q ${qx1},${wave2qy1} ${x1},${wave2H} 
    T ${x2},${wave2H} 
    T ${x3},${wave2H} 
    T ${W},${wave2H} 
    L ${W},${height} L 0,${height} Z`;

  return (
    <View style={containerStyle}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Layer 0: Base */}
        <LinearGradient
          colors={['#EAF4FF', '#F3EEFF', '#FFEFF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Layer 1: Moving Band */}
        <Animated.View
          style={[
            styles.bandContainer,
            { width: bandWidth * 2, transform: [{ translateX: bandTranslateX }] },
          ]}
        >
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 1, y: 0.7 }}
            style={{ width: bandWidth, height: '100%' }}
          />
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 1, y: 0.7 }}
            style={{ width: bandWidth, height: '100%' }}
          />
        </Animated.View>

        {/* Layer 2: Waves */}
        <Animated.View style={[StyleSheet.absoluteFill, { width: waveWidth * 2, transform: [{ translateX: wave1TranslateX }] }]}>
          <Svg width={waveWidth * 2} height={height}>
            <Defs>
              <SvgLinearGradient id="wave1Grad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={colors[1]} stopOpacity={0.35 * opacityMultiplier} />
                <Stop offset="0.5" stopColor={colors[3]} stopOpacity={0.45 * opacityMultiplier} />
                <Stop offset="1" stopColor={colors[1]} stopOpacity={0.35 * opacityMultiplier} />
              </SvgLinearGradient>
              <SvgLinearGradient id="fadeGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="white" stopOpacity="0" />
                <Stop offset="1" stopColor="white" stopOpacity="0.8" />
              </SvgLinearGradient>
            </Defs>
            <Path d={pathData} fill="url(#wave1Grad)" />
            <Path d={pathData} fill="url(#wave1Grad)" x={waveWidth} />
          </Svg>
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFill, { width: waveWidth * 2, transform: [{ translateX: wave2TranslateX }] }]}>
          <Svg width={waveWidth * 2} height={height}>
            <Defs>
              <SvgLinearGradient id="wave2Grad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={colors[2]} stopOpacity={0.45 * opacityMultiplier} />
                <Stop offset="0.5" stopColor={colors[4]} stopOpacity={0.35 * opacityMultiplier} />
                <Stop offset="1" stopColor={colors[2]} stopOpacity={0.45 * opacityMultiplier} />
              </SvgLinearGradient>
            </Defs>
            <Path d={path2Data} fill="url(#wave2Grad)" />
            <Path d={path2Data} fill="url(#wave2Grad)" x={waveWidth} />
          </Svg>
        </Animated.View>

        {/* Layer 3: Mist Overlay */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.30)' }]} />

        {/* Header Fade Out */}
        {variant === 'header' && (
          <LinearGradient
            colors={['transparent', COLORS.bg]}
            style={styles.headerFade}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
        )}
      </View>
      
      {/* Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    overflow: 'hidden',
  },
  bandContainer: {
    position: 'absolute',
    flexDirection: 'row',
    height: '100%',
    top: 0,
    left: 0,
  },
  headerFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
});
