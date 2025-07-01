import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth headers
apiClient.interceptors.request.use((config) => {
  // Add auth headers if available
  const authHeaders = getAuthHeaders();
  if (authHeaders.authorization) {
    config.headers.authorization = authHeaders.authorization;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Get auth headers helper
function getAuthHeaders() {
  // This should be imported from auth context
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user?.uid ? { authorization: `Bearer ${user.uid}` } : {};
}

export { apiClient };
export default apiClient;