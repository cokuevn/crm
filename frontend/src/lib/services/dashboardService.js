import apiClient from '../apiClient';

export async function fetchDashboard(capitalId) {
  const { data } = await apiClient.get('/api/dashboard', { params: { capital_id: capitalId } });
  return data;
}

