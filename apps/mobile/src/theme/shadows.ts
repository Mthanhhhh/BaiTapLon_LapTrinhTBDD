import { Platform } from 'react-native';
import { COLORS } from './colors';

export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: COLORS.primaryDeep,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    android: {
      elevation: 3,
    },
    web: {
      boxShadow: '0 4px 12px rgba(85, 91, 167, 0.10)',
    },
  }),
  md: Platform.select({
    ios: {
      shadowColor: COLORS.primaryDeep,
      shadowOffset: { width: 0, height: 7 },
      shadowOpacity: 0.13,
      shadowRadius: 14,
    },
    android: {
      elevation: 4,
    },
    web: {
      boxShadow: '0 7px 20px rgba(85, 91, 167, 0.13)',
    },
  }),
};
