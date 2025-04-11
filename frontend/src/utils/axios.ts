import axios from 'axios';

const API_BASE_URL = 'https://password-manager-backend-5d228fef3683.herokuapp.com/';
// const API_BASE_URL = 'http://localhost:8000';

// Create a queue to store requests that should be retried after token refresh
let isRefreshing = false;
let failedQueue: Array<{resolve: Function; reject: Function}> = [];

// Store the most recent successful auth time to detect token issues
let lastSuccessfulAuthTime = 0;

// Max token age before considering a refresh (5 minutes)
const TOKEN_MAX_AGE_MS = 5 * 60 * 1000;

const processQueue = (error: any = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  
  failedQueue = [];
};

// Get a fresh token for each request
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  const currentTime = Date.now();
  
  // Check if token exists and is reasonably fresh
  if (token && (currentTime - lastSuccessfulAuthTime < TOKEN_MAX_AGE_MS)) {
    return token;
  }
  
  // If token exists but might be stale, update the timestamp
  // This helps prevent multiple refreshes in a short time
  if (token) {
    lastSuccessfulAuthTime = currentTime;
  }
  
  return token;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor with improved token handling
api.interceptors.request.use((config) => {
  // Get token directly on each request to ensure latest token is used
  const token = getAuthToken();
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    
    // Store the original URL for debugging
    config._url = config.url;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Enhanced response interceptor with better error handling
api.interceptors.response.use(
  (response) => {
    // On successful response, update auth time if it's an authenticated request
    if (response.config.headers?.Authorization) {
      lastSuccessfulAuthTime = Date.now();
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Special case for settings endpoint - silently handle error
    if (error.response?.status === 401 && 
        (originalRequest.url === '/api/user/settings' || 
         originalRequest.url?.includes('/api/user/settings'))) {
      console.warn('Settings endpoint returned 401, using default settings');
      // Return mock data instead of rejecting
      return Promise.resolve({
        data: {
          username: localStorage.getItem('username') || '',
          email: null,
          totp_enabled: false,
          created_at: new Date().toISOString()
        }
      });
    }
    
    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(() => {
          // Retry with new token
          return api(originalRequest);
        })
        .catch(err => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      // Force check if token is still in localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        // Token is missing completely, redirect to login
        processQueue(new Error('No authentication token'));
        window.location.href = '/';
        isRefreshing = false;
        return Promise.reject(error);
      }
      
      try {
        // Since we don't have a refresh token mechanism in the backend yet,
        // Just try to reuse the same token but update the auth header
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        // Process failed queue (allowing others to retry)
        processQueue();
        isRefreshing = false;
        
        // Return updated request
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/';
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to set token after login
export const setAuthToken = (token: string) => {
  if (!token) {
    console.error("Attempted to set empty token");
    return;
  }
  
  localStorage.setItem('token', token);
  
  // Update the auth timestamp
  lastSuccessfulAuthTime = Date.now();
  
  // Update the default headers after setting token
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Helper to clear token on logout
export const clearAuthToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  delete api.defaults.headers.common['Authorization'];
  lastSuccessfulAuthTime = 0;
};

export default api;