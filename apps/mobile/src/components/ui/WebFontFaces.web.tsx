import React from 'react';
import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
// Keep browser font declarations mounted with the app, including across web navigation.
export function WebFontFaces() {
  const faces: Record<string, string | number> = {
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    ...Ionicons.font,
  };
  return <style>{Object.entries(faces).map(([name,source]) => `@font-face{font-family:${JSON.stringify(name)};src:url(${JSON.stringify(Asset.fromModule(source).uri)});font-display:swap}`).join('\n')}</style>;
}

