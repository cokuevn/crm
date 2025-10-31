import axios from 'axios';
import { signOut } from 'firebase/auth';
import { API } from './api';
import { auth } from '../contexts/AuthContext';

// Axios instance with baseURL and auth interceptor
export const apiClient = axios.create({ baseURL: API, headers: { 'Content-Type': 'application/json' } });

// Attach Authorization header from current user (Firebase-like)
apiClient.interceptors.request.use(async (config) => {
  try {
    // If AuthContext exports firebase auth, fallback to window.auth if needed
    const currentUser = auth?.currentUser || null;
    if (currentUser?.uid) {
      // TODO: replace uid with ID token when backend supports it
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${currentUser.uid}`;
    }
  } catch (e) {
    // noop
  }
  return config;
});

export default apiClient;

// Helper: legacy-compatible headers builder (no-op for auth as interceptor injects it)
export const withAuth = (extra = {}) => ({ headers: { ...extra } });

// Global response interceptor for auth errors
apiClient.interceptors.response.use(
  (response) => {
    // Log response data for debugging date issues
    if (response.config.url?.includes('/clients/')) {
      console.debug('[API] Response from', response.config.url, {
        hasData: !!response.data,
        dataType: typeof response.data
      });
    }
    return response;
  },
  async (error) => {
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

