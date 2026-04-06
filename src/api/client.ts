import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Config from 'react-native-config';
import * as authService from '../auth/authService';
import { useAuthStore } from '../stores/authStore';

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface QueueItem {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

function processQueue(errorOrNull: unknown, token: string | null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (errorOrNull) {
      reject(errorOrNull);
    } else {
      resolve(token as string);
    }
  });
  failedQueue = [];
}

const client = axios.create({
  baseURL: Config.API_BASE_URL,
});

client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { tokens } = useAuthStore.getState();
    if (tokens?.idToken) {
      config.headers.Authorization = `Bearer ${tokens.idToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequest | undefined;

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(client(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const { tokens } = useAuthStore.getState();

    if (!tokens?.refreshToken) {
      isRefreshing = false;
      processQueue(error, null);
      await useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    try {
      const newTokens = await authService.refreshSession(tokens.refreshToken);
      await authService.storeTokens(newTokens);
      const user = authService.decodeIdToken(newTokens.idToken);
      useAuthStore.setState({ tokens: newTokens, user, isAuthenticated: true });
      processQueue(null, newTokens.idToken);
      originalRequest.headers.Authorization = `Bearer ${newTokens.idToken}`;
      return client(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default client;
