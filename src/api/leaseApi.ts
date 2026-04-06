import client, { normalizeError } from './client';
import type {
  Lease,
  LeaseSummary,
  MileageHistory,
  CreateLeaseInput,
  UpdateLeaseInput,
} from '../types/api';

export async function getLeases(): Promise<Lease[]> {
  try {
    const response = await client.get<Lease[]>('/leases');
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getLease(id: string): Promise<Lease> {
  try {
    const response = await client.get<Lease>(`/leases/${id}`);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function createLease(data: CreateLeaseInput): Promise<Lease> {
  try {
    const response = await client.post<Lease>('/leases', data);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function updateLease(id: string, data: UpdateLeaseInput): Promise<Lease> {
  try {
    const response = await client.put<Lease>(`/leases/${id}`, data);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function deleteLease(id: string): Promise<void> {
  try {
    await client.delete(`/leases/${id}`);
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getLeaseSummary(id: string): Promise<LeaseSummary> {
  try {
    const response = await client.get<LeaseSummary>(`/leases/${id}/summary`);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getMileageHistory(id: string): Promise<MileageHistory> {
  try {
    const response = await client.get<MileageHistory>(`/leases/${id}/mileage-history`);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}
