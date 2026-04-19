import client, { normalizeError } from './client';
import type {
  AlertConfig,
  CreateAlertConfigInput,
  UpdateAlertConfigInput,
} from '../types/api';

export async function getAlerts(leaseId: string): Promise<AlertConfig[]> {
  try {
    const response = await client.get<AlertConfig[]>(`/api/leases/${leaseId}/alerts`);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function createAlert(
  leaseId: string,
  input: CreateAlertConfigInput,
): Promise<AlertConfig> {
  try {
    const response = await client.post<AlertConfig>(`/api/leases/${leaseId}/alerts`, input);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function updateAlert(
  leaseId: string,
  alertId: string,
  input: UpdateAlertConfigInput,
): Promise<AlertConfig> {
  try {
    const response = await client.put<AlertConfig>(
      `/api/leases/${leaseId}/alerts/${alertId}`,
      input,
    );
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}
