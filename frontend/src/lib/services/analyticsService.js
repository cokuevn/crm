import apiClient from '../apiClient';

export async function fetchAnalytics(capitalId) {
  const { data } = await apiClient.get(`/api/analytics/${capitalId}`);
  return data;
}

export async function fetchAnalyticsV2(capitalId) {
  const { data } = await apiClient.get(`/api/analytics-v2/${capitalId}`);
  return data;
}

export async function fetchMonthPaymentsV2(capitalId, { month, includeOverdue = false } = {}) {
  const params = new URLSearchParams();
  if (month) params.set('month', month);
  if (includeOverdue) params.set('include_overdue', '1');
  const qs = params.toString();
  const { data } = await apiClient.get(`/api/analytics-v2/${capitalId}/month-payments${qs ? `?${qs}` : ''}`);
  return data;
}

