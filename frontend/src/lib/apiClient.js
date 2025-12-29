import axios from 'axios';
import { signOut } from 'firebase/auth';
import { API } from './api';
import { auth } from '../contexts/AuthContext';
import notificationService from '../services/notificationService';

// Axios instance with baseURL and auth interceptor
export const apiClient = axios.create({ baseURL: API, headers: { 'Content-Type': 'application/json' } });

// Attach Authorization header from current user (Firebase-like)
apiClient.interceptors.request.use(async (config) => {
  try {
    // 1. Get current user
    let currentUser = auth?.currentUser;
    
    // 2. If no user yet, but Firebase might be still initializing, wait a bit
    if (!currentUser) {
      // Short wait for Firebase to populate currentUser
      await new Promise(resolve => {
        const timeout = setTimeout(resolve, 500); // Max wait 0.5s
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
      
      // Update PWA config
      try {
        await notificationService.saveConfigForBackgroundSync(API, currentUser.uid);
      } catch (e) {}
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

// Retry logic for failed requests
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const config = error.config;
    // Only retry if it's a network error or a transient 5xx error, and we haven't retried yet
    if (!config || !config.retryCount) config.retryCount = 0;
    
    const shouldRetry = 
      config.retryCount < 2 && 
      (error.message === 'Network Error' || (error.response && error.response.status >= 500));

    if (shouldRetry) {
      config.retryCount += 1;
      const backoffDelay = config.retryCount * 1000;
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
      return apiClient(config);
    }

    const status = error?.response?.status;
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

