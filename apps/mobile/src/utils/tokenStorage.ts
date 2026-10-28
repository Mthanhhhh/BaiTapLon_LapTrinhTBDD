import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'ACCESS_TOKEN';
const REFRESH_TOKEN_KEY = 'REFRESH_TOKEN';
const REMEMBER_ME_KEY = 'REMEMBER_ME';

export const tokenStorage = {
  async setTokens(accessToken: string, refreshToken: string) {
    if (Platform.OS === 'web') {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  async setRememberMe(remember: boolean) {
    if (Platform.OS === 'web') {
      localStorage.setItem(REMEMBER_ME_KEY, remember ? 'true' : 'false');
    } else {
      await SecureStore.setItemAsync(REMEMBER_ME_KEY, remember ? 'true' : 'false');
    }
  },

  async isRememberMe(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
    }
    const val = await SecureStore.getItemAsync(REMEMBER_ME_KEY);
    return val !== 'false';
  },

  async getAccessToken() {
    if (Platform.OS === 'web') {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async getRefreshToken() {
    if (Platform.OS === 'web') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async clearTokens() {
    if (Platform.OS === 'web') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(REMEMBER_ME_KEY);
    } else {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REMEMBER_ME_KEY);
    }
  },
};

