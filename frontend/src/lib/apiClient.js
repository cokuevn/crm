import axios from 'axios';
import { signOut } from 'firebase/auth';
import { API } from './api';
import { auth } from '../contexts/AuthContext';
import notificationService from '../services/notificationService';

// Axios instance with baseURL, timeout, and auth interceptor
export const apiClient = axios.create({ 
  baseURL: API, 
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30 second timeout for all requests
});

// Attach Authorization header from current user (Firebase-like)
apiClient.interceptors.request.use(async (config) => {
  try {
    // 1. Get current user
    let currentUser = auth?.currentUser;
    
    // 2. If no user yet, but Firebase might be still initializing, wait a bit (reduced time)
    if (!currentUser) {
      // Very short wait for Firebase to populate currentUser
      await new Promise(resolve => {
        const timeout = setTimeout(resolve, 200); // Max wait 0.2s (reduced from 0.5s)
        const unsubscribe = auth.onAuthStateChanged((user) => {
          clearTimeout(timeout);
          unsubscribe();
          currentUser = user;
          resolve();
        });
      });
    }

    if (currentUser) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${currentUser.uid}`;
      
      // Update PWA config (non-blocking)
      notificationService.saveConfigForBackgroundSync(API, currentUser.uid).catch(() => {});
    }
  } catch (e) {
    console.error('Error in auth interceptor:', e);
  }
  return config;
});

// Helper to wait for auth to be ready
export const waitForAuth = () => {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

export default apiClient;

// Retry logic for failed requests (optimized)
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const config = error.config;
    
    // Only retry if it's a network error or a transient 5xx error, and we haven't retried yet
    if (!config || !config.retryCount) config.retryCount = 0;
    
    // Check if it's a timeout error
    const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
    
    // Reduce retries to 1 attempt (faster fail) and only for 5xx errors, not network errors
    const shouldRetry = 
      config.retryCount < 1 && 
      !isTimeout && // Don't retry timeouts
      (error.response && error.response.status >= 500 && error.response.status < 600);

    if (shouldRetry) {
      config.retryCount += 1;
      const backoffDelay = 500; // Fixed 500ms delay instead of increasing
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      return apiClient(config);
    }

    const status = error?.response?.status;
    
    // Handle timeout errors
    if (isTimeout) {
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(
          new CustomEvent('app:notify', {
            detail: {
              type: 'error',
              title: 'Превышено время ожидания',
              message: 'Сервер не отвечает. Проверьте подключение к интернету.',
            },
          })
        );
      }
    }
    
    // Handle authentication errors
    if (status === 401) {
      try {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(
            new CustomEvent('app:notify', {
              detail: {
                type: 'error',
                title: 'Сессия истекла',
                message: 'Пожалуйста, войдите снова',
              },
            })
          );
        }
      } catch (_) {}
      try {
        await signOut(auth);
      } catch (_) {}
    }
    
    return Promise.reject(error);
  }
);

