import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Config from 'react-native-config';
import * as authService from '../auth/authService';
import { useAuthStore } from '../stores/authStore';

export interface NormalizedError {
  message: string;
  statusCode: number | null;
  details?: unknown;
}

export class ApiError extends Error implements NormalizedError {
  readonly statusCode: number | null;
  readonly details?: unknown;

  constructor(message: string, statusCode: number | null, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof AxiosError) {
    const data: unknown = error.response?.data;
    const dataObj = data !== null && typeof data === 'object' ? (data as Record<string, unknown>) : null;
    const message =
      typeof dataObj?.message === 'string'
        ? dataObj.message
        : error.message || 'An unexpected error occurred';
    const statusCode = error.response?.status ?? null;
    return new ApiError(message, statusCode, data);
  }
  if (error instanceof Error) {
    return new ApiError(error.message, null);
  }
  return new ApiError('An unexpected error occurred', null);
}

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
      return Promise.reject(normalizeError(error));
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
      processQueue(normalizeError(error), null);
      await useAuthStore.getState().logout();
      return Promise.reject(normalizeError(error));
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
      processQueue(normalizeError(refreshError), null);
      await useAuthStore.getState().logout();
      return Promise.reject(normalizeError(refreshError));
    } finally {
      isRefreshing = false;
    }
  },
);

export default client;
