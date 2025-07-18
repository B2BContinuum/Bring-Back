import axios from 'axios';
import { API_BASE_URL } from '../config';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Add request interceptor for authentication
apiClient.interceptors.request.use(
  async (config) => {
    // Get token from storage
    const token = await getAuthToken();
    
    // If token exists, add to headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
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
        // This would typically be handled by a navigation service or context
        console.error('Token refresh failed:', refreshError);
        // handleLogout();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to get auth token from storage
async function getAuthToken(): Promise<string | null> {
  // Implementation would depend on your storage solution
  // For example, using AsyncStorage:
  // return await AsyncStorage.getItem('authToken');
  return null; // Placeholder
}

// Helper function to refresh auth token
async function refreshAuthToken(): Promise<string> {
  // Implementation would depend on your authentication flow
  // For example:
  // const refreshToken = await AsyncStorage.getItem('refreshToken');
  // const response = await axios.post('/api/auth/refresh', { refreshToken });
  // await AsyncStorage.setItem('authToken', response.data.token);
  // return response.data.token;
  throw new Error('Token refresh not implemented');
}

// Helper function to handle logout
function handleLogout() {
  // Implementation would depend on your authentication flow
  // For example:
  // AsyncStorage.removeItem('authToken');
  // AsyncStorage.removeItem('refreshToken');
  // Navigate to login screen
}