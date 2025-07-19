import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { logger } from '../utils/logger';
import { createError, retryWithBackoff, ErrorType } from '../utils/errorHandler';
import NetInfo from '@react-native-community/netinfo';

// Constants
const AUTH_TOKEN_KEY = '@CommunityDelivery:authToken';
const REFRESH_TOKEN_KEY = '@CommunityDelivery:refreshToken';
const DEFAULT_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 3;

// Network state
let isConnected = true;

// Monitor network connectivity
NetInfo.addEventListener(state => {
  isConnected = state.isConnected === true;
  logger.info(`Network status changed: ${isConnected ? 'connected' : 'disconnected'}`);
});

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: DEFAULT_TIMEOUT,
});

// Add request ID to each request
let requestCounter = 0;
const getRequestId = () => {
  requestCounter += 1;
  return `req_${Date.now()}_${requestCounter}`;
};

// Add request interceptor for authentication and logging
apiClient.interceptors.request.use(
  async (config) => {
    // Check network connectivity
    if (!isConnected) {
      throw new Error('No internet connection');
    }
    
    // Add request ID
    const requestId = getRequestId();
    config.headers['X-Request-ID'] = requestId;
    
    // Get token from storage
    const token = await getAuthToken();
    
    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request
    logger.debug({
      type: 'api_request',
      requestId,
      url: `${config.baseURL}${config.url}`,
      method: config.method,
      headers: { ...config.headers, Authorization: token ? 'Bearer [REDACTED]' : undefined },
      data: config.data ? '[REDACTED]' : undefined,
    });
    
    return config;
  },
  (error) => {
    logger.error({
      type: 'api_request_error',
      error: error.message,
      stack: error.stack,
    });
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling and logging
apiClient.interceptors.response.use(
  (response) => {
    // Log successful response
    logger.debug({
      type: 'api_response',
      requestId: response.config.headers['X-Request-ID'],
      url: response.config.url,
      status: response.status,
      statusText: response.statusText,
      data: '[REDACTED]', // Don't log response data for privacy
      time: response.headers['x-response-time'] || 'unknown',
    });
    
    return response;
  },
  async (error) => {
    // Log error response
    logger.error({
      type: 'api_response_error',
      requestId: error.config?.headers?.['X-Request-ID'] || 'unknown',
      url: error.config?.url || 'unknown',
      status: error.response?.status || 'network_error',
      statusText: error.response?.statusText || error.message,
      data: error.response?.data || undefined,
      stack: error.stack,
    });
    
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Attempt to refresh token
        const newToken = await refreshAuthToken();
        
        // Update authorization header
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        
        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        logger.warn({
          type: 'auth_refresh_failed',
          error: refreshError instanceof Error ? refreshError.message : 'Unknown error',
        });
        
        // Clear auth tokens
        await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY]);
        
        // Notify auth state listeners
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth_logout'));
        }
        
        return Promise.reject(createError(refreshError));
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to get auth token from storage
export async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    logger.error({
      type: 'auth_token_get_error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

// Helper function to refresh auth token
export async function refreshAuthToken(): Promise<string> {
  try {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
    
    if (response.data.token) {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
      
      // Update refresh token if provided
      if (response.data.refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
      }
      
      return response.data.token;
    } else {
      throw new Error('Invalid token response');
    }
  } catch (error) {
    logger.error({
      type: 'auth_refresh_error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Helper function to set auth tokens
export async function setAuthTokens(token: string, refreshToken: string): Promise<void> {
  try {
    await AsyncStorage.multiSet([
      [AUTH_TOKEN_KEY, token],
      [REFRESH_TOKEN_KEY, refreshToken],
    ]);
  } catch (error) {
    logger.error({
      type: 'auth_token_set_error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Helper function to clear auth tokens
export async function clearAuthTokens(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  } catch (error) {
    logger.error({
      type: 'auth_token_clear_error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Enhanced API methods with retry logic
export const api = {
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return retryWithBackoff(async () => {
      const response = await apiClient.get<T>(url, config);
      return response.data;
    }, MAX_RETRIES);
  },
  
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return retryWithBackoff(async () => {
      const response = await apiClient.post<T>(url, data, config);
      return response.data;
    }, MAX_RETRIES);
  },
  
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return retryWithBackoff(async () => {
      const response = await apiClient.put<T>(url, data, config);
      return response.data;
    }, MAX_RETRIES);
  },
  
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return retryWithBackoff(async () => {
      const response = await apiClient.delete<T>(url, config);
      return response.data;
    }, MAX_RETRIES);
  },
  
  // Method for uploading files
  upload: async <T = any>(url: string, formData: FormData, onProgress?: (progress: number) => void): Promise<T> => {
    return retryWithBackoff(async () => {
      const response = await apiClient.post<T>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      });
      return response.data;
    }, MAX_RETRIES);
  },
};