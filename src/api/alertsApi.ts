import client, { normalizeError } from './client';
import type { AlertConfig, UpdateAlertConfigInput } from '../types/api';

export async function getAlertConfigs(leaseId: string): Promise<AlertConfig[]> {
  try {
    const response = await client.get<AlertConfig[]>(`/api/leases/${leaseId}/alerts`);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function updateAlertConfig(
  leaseId: string,
  alertId: string,
  data: UpdateAlertConfigInput,
): Promise<AlertConfig> {
  try {
    const response = await client.put<AlertConfig>(`/api/leases/${leaseId}/alerts/${alertId}`, data);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}
