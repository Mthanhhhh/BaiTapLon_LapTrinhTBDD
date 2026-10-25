import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../../theme';
import { AuroraBackgroundProps, AuroraPalette } from './AuroraBackground';

const { width, height } = Dimensions.get('window');

const PALETTES: Record<AuroraPalette, readonly [string, string, ...string[]]> = {
  calm: ['#BDEBF2', '#C9E2FF', '#DCD3FF', '#F8CFE3', '#DCD3FF', '#C9E2FF', '#BDEBF2'],
  candy: ['#BDEBF2', '#C9E2FF', '#DCD3FF', '#FFD8C2', '#BDEFD9', '#DCD3FF', '#BDEBF2'],
};

// Web specific CSS injection
const css = `
@keyframes sweepBand {
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
}
@keyframes slideWave1 {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes slideWave2 {
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}
.aurora-band-web {
  background-size: 300% 100%;
  animation: sweepBand 22s linear infinite;
  will-change: background-position;
}
.aurora-wave1 { animation: slideWave1 18s linear infinite; will-change: transform; }
.aurora-wave2 { animation: slideWave2 28s linear infinite; will-change: transform; }
.aurora-reduce-motion .aurora-band-web,
.aurora-reduce-motion .aurora-wave1,
.aurora-reduce-motion .aurora-wave2 {
  animation: none !important;
}
`;

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  palette = 'calm',
  variant = 'full',
  intensity = 'normal',
  paused = false,
  headerHeight = 240,
  children,
}) => {
  const colors = PALETTES[palette];
  const opacityMultiplier = intensity === 'soft' ? 0.8 : 1;

  if (typeof document !== 'undefined') {
    const styleId = 'aurora-bg-styles-v2';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.appendChild(document.createTextNode(css));
      document.head.appendChild(style);
    }
  }

  const containerStyle = [
    styles.container,
    variant === 'header' && { height: headerHeight, overflow: 'hidden' as const },
  ];

  const motionClass = paused ? 'aurora-reduce-motion' : '';

  // SVG Waves
  const wWidth = typeof window !== 'undefined' ? window.innerWidth * 2 : width * 2;
  const wHeight = typeof window !== 'undefined' ? window.innerHeight : height;
  const A = wHeight * 0.08;
  const H = wHeight * 0.4;
  const W = wWidth;
  const qx1 = W / 8;
  const qy1 = H - A;
  const x1 = W / 4;
  const x2 = W / 2;
  const x3 = (3 * W) / 4;
  const path1 = `M 0,${H} Q ${qx1},${qy1} ${x1},${H} T ${x2},${H} T ${x3},${H} T ${W},${H} L ${W},${wHeight} L 0,${wHeight} Z`;

  const H2 = wHeight * 0.65;
  const qy2 = H2 + A;
  const path2 = `M 0,${H2} Q ${qx1},${qy2} ${x1},${H2} T ${x2},${H2} T ${x3},${H2} T ${W},${H2} L ${W},${wHeight} L 0,${wHeight} Z`;

  return (
    <View style={containerStyle}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Base */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom right, #EAF4FF, #F3EEFF, #FFEFF6)'
        }} />

        {/* Sweeping Band */}
        <div 
          className={`aurora-band-web ${motionClass}`}
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(100deg, ${colors.join(', ')})`,
          }}
        />

        {/* Waves via inline SVG */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div className={`aurora-wave1 ${motionClass}`} style={{ width: '200%', height: '100%', position: 'absolute' }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${W} ${wHeight}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={colors[1]} stopOpacity={0.35 * opacityMultiplier} />
                  <stop offset="50%" stopColor={colors[3]} stopOpacity={0.45 * opacityMultiplier} />
                  <stop offset="100%" stopColor={colors[1]} stopOpacity={0.35 * opacityMultiplier} />
                </linearGradient>
              </defs>
              <path d={path1} fill="url(#g1)" />
              <path d={path1} fill="url(#g1)" transform={`translate(${W}, 0)`} />
            </svg>
          </div>
          <div className={`aurora-wave2 ${motionClass}`} style={{ width: '200%', height: '100%', position: 'absolute' }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${W} ${wHeight}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="g2" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={colors[2]} stopOpacity={0.45 * opacityMultiplier} />
                  <stop offset="50%" stopColor={colors[4]} stopOpacity={0.35 * opacityMultiplier} />
                  <stop offset="100%" stopColor={colors[2]} stopOpacity={0.45 * opacityMultiplier} />
                </linearGradient>
              </defs>
              <path d={path2} fill="url(#g2)" />
              <path d={path2} fill="url(#g2)" transform={`translate(${W}, 0)`} />
            </svg>
          </div>
        </div>

        {/* Mist */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundColor: 'rgba(255,255,255,0.30)'
        }} />

        {/* Header Fade */}
        {variant === 'header' && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
            background: `linear-gradient(to bottom, transparent, ${COLORS.bg})`
          }} />
        )}
      </View>
      {children}
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
};
