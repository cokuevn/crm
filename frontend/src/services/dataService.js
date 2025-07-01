import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants/api';

export const expenseService = {
  // Get expenses
  getAll: async (capitalId = null) => {
    const params = capitalId ? { capital_id: capitalId } : {};
    const response = await apiClient.get(API_ENDPOINTS.EXPENSES.BASE, { params });
    return response.data;
  },

  // Create expense
  create: async (expenseData) => {
    const response = await apiClient.post(API_ENDPOINTS.EXPENSES.BASE, expenseData);
    return response.data;
  },

  // Update expense
  update: async (id, expenseData) => {
    const response = await apiClient.put(API_ENDPOINTS.EXPENSES.BY_ID(id), expenseData);
    return response.data;
  },

  // Delete expense
  delete: async (id) => {
    await apiClient.delete(API_ENDPOINTS.EXPENSES.BY_ID(id));
  }
};

export const analyticsService = {
  // Get analytics for capital
  getByCapital: async (capitalId) => {
    const response = await apiClient.get(API_ENDPOINTS.ANALYTICS.BY_CAPITAL(capitalId));
    return response.data;
  }
};

export const dashboardService = {
  // Get dashboard data
  getData: async (capitalId = null) => {
    const params = capitalId ? { capital_id: capitalId } : {};
    const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.BASE, { params });
    return response.data;
  }
};