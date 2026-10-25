import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 10.0.2.2 is the localhost alias for Android emulator. 
// For real devices, replace with your machine's local IP address (e.g., 192.168.1.X)
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8080/api/v1' : 'http://localhost:8080/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;

