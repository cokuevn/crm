import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants/api';

export const capitalService = {
  // Get all capitals
  getAll: async () => {
    const response = await apiClient.get(API_ENDPOINTS.CAPITALS.BASE);
    return response.data;
  },

  // Create new capital
  create: async (capitalData) => {
    const response = await apiClient.post(API_ENDPOINTS.CAPITALS.BASE, capitalData);
    return response.data;
  },

  // Update capital
  update: async (id, capitalData) => {
    const response = await apiClient.put(API_ENDPOINTS.CAPITALS.BY_ID(id), capitalData);
    return response.data;
  },

  // Delete capital
  delete: async (id) => {
    await apiClient.delete(API_ENDPOINTS.CAPITALS.BY_ID(id));
  },

  // Update capital balance
  updateBalance: async (id, newBalance) => {
    const response = await apiClient.patch(API_ENDPOINTS.CAPITALS.BY_ID(id), { balance: newBalance });
    return response.data;
  },

  // Auto-initialize demo data
  autoInit: async () => {
    const response = await apiClient.get(API_ENDPOINTS.AUTH.AUTO_INIT);
    return response.data;
  }
};