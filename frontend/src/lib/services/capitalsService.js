import apiClient from '../apiClient';

export async function listCapitals() {
  const { data } = await apiClient.get('/api/capitals');
  return data;
}

export async function createCapital(payload) {
  const { data } = await apiClient.post('/api/capitals', payload);
  return data;
}

export async function deleteCapital(capitalId) {
  await apiClient.delete(`/api/capitals/${capitalId}`);
}

export async function updateCapitalBalance(capitalId, balance) {
  const { data } = await apiClient.put(`/api/capitals/${capitalId}`, { balance });
  return data;
}

