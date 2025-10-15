import apiClient from '../apiClient';

export async function listExpenses(capitalId) {
  const { data } = await apiClient.get('/api/expenses', { params: { capital_id: capitalId } });
  return data;
}

export async function deleteExpense(expenseId) {
  await apiClient.delete(`/api/expenses/${expenseId}`);
}

export async function createExpense(payload) {
  const { data } = await apiClient.post('/api/expenses', payload);
  return data;
}

export async function updateExpense(expenseId, payload) {
  const { data } = await apiClient.put(`/api/expenses/${expenseId}`, payload);
  return data;
}

