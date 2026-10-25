import { Platform } from 'react-native';
import { COLORS } from './colors';

export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: COLORS.ink,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
    web: {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
    },
  }),
  md: Platform.select({
    ios: {
      shadowColor: COLORS.ink,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
    web: {
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.08)',
    },
  }),
};
