import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../constants/api';

export const clientService = {
  // Get all clients
  getAll: async (capitalId = null) => {
    const params = capitalId ? { capital_id: capitalId } : {};
    const response = await apiClient.get(API_ENDPOINTS.CLIENTS.BASE, { params });
    return response.data;
  },

  // Get single client
  getById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.CLIENTS.BY_ID(id));
    return response.data;
  },

  // Create new client
  create: async (clientData) => {
    const response = await apiClient.post(API_ENDPOINTS.CLIENTS.BASE, clientData);
    return response.data;
  },

  // Update client
  update: async (id, clientData) => {
    const response = await apiClient.put(API_ENDPOINTS.CLIENTS.BY_ID(id), clientData);
    return response.data;
  },

  // Delete client
  delete: async (id) => {
    await apiClient.delete(API_ENDPOINTS.CLIENTS.BY_ID(id));
  },

  // Update payment status
  updatePaymentStatus: async (clientId, paymentDate, status) => {
    const response = await apiClient.put(
      API_ENDPOINTS.CLIENTS.PAYMENTS(clientId, paymentDate),
      { status }
    );
    return response.data;
  },

  // Bulk import clients
  bulkImport: async (clients, capitalId) => {
    const results = [];
    for (const clientData of clients) {
      try {
        const clientPayload = {
          capital_id: capitalId,
          name: clientData.name,
          product: clientData.product,
          purchase_amount: clientData.purchase_amount,
          debt_amount: clientData.debt_amount,
          monthly_payment: clientData.monthly_payment,
          start_date: clientData.start_date,
          months: clientData.months || clientData.schedule?.length || 12,
          guarantor_name: clientData.guarantor_name,
          client_address: clientData.client_address,
          client_phone: clientData.client_phone,
          guarantor_phone: clientData.guarantor_phone,
          schedule: clientData.schedule || null
        };

        const response = await clientService.create(clientPayload);
        results.push({ success: true, data: response });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    return results;
  }
};