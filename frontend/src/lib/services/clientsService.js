import apiClient from '../apiClient';

export async function getClient(clientId) {
  const { data } = await apiClient.get(`/api/clients/${clientId}`);
  return data;
}

export async function deleteClient(clientId) {
  await apiClient.delete(`/api/clients/${clientId}`);
}

export async function completeClient(clientId) {
  const { data } = await apiClient.put(`/api/clients/${clientId}/complete`);
  return data;
}

export async function updatePaymentStatus(clientId, paymentDate, status) {
  const { data } = await apiClient.put(`/api/clients/${clientId}/payments/${paymentDate}`, { status });
  return data;
}

