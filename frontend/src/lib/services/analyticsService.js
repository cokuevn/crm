import apiClient from '../apiClient';

export async function fetchAnalytics(capitalId) {
  const { data } = await apiClient.get(`/api/analytics/${capitalId}`);
  return data;
}

