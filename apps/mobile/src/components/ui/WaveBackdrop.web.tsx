import React from 'react';
import { COLORS } from '../../theme';
import { PASTEL_BAND, PASTEL_HAZE, PASTEL_TRAVEL_MS } from './pastelMotion';

// A moving field of softly blended color, rather than outlined SVG waves.
export function WaveBackdrop() {
  return (
    <div className="eshop-pastel-background" aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', background: COLORS.bg }}>
      <style>{`
        @keyframes eshop-pastel-drift { from { transform: translate3d(0,0,0); } to { transform: translate3d(-66.6667%,0,0); } }
        @keyframes eshop-pastel-breathe { from { opacity: .18; transform: translate3d(0,-3%,0); } to { opacity: .5; transform: translate3d(0,3%,0); } }
        .eshop-color-band { position: absolute; top: -15%; left: 0; width: 300%; height: 130%; will-change: transform; animation: eshop-pastel-drift ${PASTEL_TRAVEL_MS}ms ease-in-out infinite alternate; }
        .eshop-color-haze { position: absolute; inset: -15%; will-change: transform, opacity; animation: eshop-pastel-breathe 13000ms ease-in-out infinite alternate; }
        @media (prefers-reduced-motion: reduce) { .eshop-color-band { animation-duration: ${PASTEL_TRAVEL_MS * 2}ms; } .eshop-color-haze { animation-duration: 26000ms; } }
      `}</style>
      <div className="eshop-color-band" style={{ background: `linear-gradient(110deg, ${PASTEL_BAND.join(', ')})` /* taste-skill-ignore: the user explicitly requested the gradient in their reference video */ }} />
      <div className="eshop-color-haze" style={{ background: `linear-gradient(165deg, ${PASTEL_HAZE.join(', ')})` /* taste-skill-ignore: the user's reference requires softly blended moving colors */ }} />
    </div>
  );
}
