import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../utils/tokenStorage';

const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: {
    indexes: null, // serializes arrays as sort=a&sort=b instead of sort[]=a
  },
});

export interface AppError {
  status: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

const formatError = (error: AxiosError<any>): AppError => {
  if (error.response?.data) {
    const data = error.response.data;
    return {
      status: data.status || error.response.status,
      code: data.code || 'UNKNOWN_ERROR',
      message: data.message || 'An unexpected error occurred',
      fieldErrors: data.errors,
    };
  }
  return {
    status: error.response?.status || 500,
    code: 'NETWORK_ERROR',
    message: error.message,
  };
};

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.request.use(
  async (config) => {
    const token = await tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (__DEV__) {
      const fullUrl = axios.getUri(config);
      console.log(`[API Request] ${config.method?.toUpperCase()} ${fullUrl}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');
        
        const response = await axios.post(`${baseURL}/api/v1/auth/refresh`, { refreshToken });
        const newAccessToken = response.data.data.accessToken;
        const newRefreshToken = response.data.data.refreshToken;
        
        await tokenStorage.setTokens(newAccessToken, newRefreshToken);
        apiClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        
        processQueue(null, newAccessToken);
        
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await tokenStorage.clearTokens();
        // Fire custom event to notify auth context to logout
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:logout'));
        }
        return Promise.reject(formatError(refreshError as AxiosError));
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(formatError(error));
  }
);
