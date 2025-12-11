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
    const currentUser = auth?.currentUser;
    if (currentUser) {
      // Ensure the session is valid by getting a fresh token.
      // This handles PWA long-lived sessions where the internal token might expire.
      const token = await currentUser.getIdToken();
      
      // Update PWA config with fresh token for background sync
      try {
        // We save the raw token (or UID if that's what backend wants, but backend accepts token too)
        // Since we send currentUser.uid in the header below for now (legacy), 
        // we should probably save what we use.
        // BUT, for background sync to work reliably if we switch to tokens later, let's save what we have.
        // Currently backend accepts UID or Token.
        // Let's save the UID for consistency with the header below, 
        // OR save the token if we want to be future proof.
        // Given the code below uses UID, let's stick to UID for now to avoid breaking changes,
        // unless backend was fully migrated to tokens.
        // However, if the user explicitly asked for "updating token", they might imply real tokens.
        // Let's safe the UID for now as it's what works in foreground.
        await notificationService.saveConfigForBackgroundSync(API, currentUser.uid);
      } catch (e) {
        // ignore errors here
      }
      
      // TODO: replace uid with ID token when backend supports verification
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${currentUser.uid}`;
    }
  } catch (e) {
    console.error('Error refreshing token:', e);
    // If token refresh fails, the session is likely invalid.
    // The request will likely fail with 401 or backend will reject it.
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

