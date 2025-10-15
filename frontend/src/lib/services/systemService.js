import apiClient from '../apiClient';

export async function autoInit() {
  await apiClient.get('/api/auto-init');
}

export async function migrateContractDates() {
  const { data } = await apiClient.post('/api/migrate-contract-dates');
  return data;
}

