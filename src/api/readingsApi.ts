import client, { normalizeError } from './client';
import type {
  OdometerReading,
  PaginationParams,
  CreateReadingInput,
  UpdateReadingInput,
} from '../types/api';

export async function getReadings(
  leaseId: string,
  params?: PaginationParams,
): Promise<OdometerReading[]> {
  try {
    const response = await client.get<OdometerReading[]>(`/api/leases/${leaseId}/readings`, {
      params,
    });
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function addReading(
  leaseId: string,
  data: CreateReadingInput,
): Promise<OdometerReading> {
  try {
    const response = await client.post<OdometerReading>(`/api/leases/${leaseId}/readings`, data);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function updateReading(
  leaseId: string,
  readingId: string,
  data: UpdateReadingInput,
): Promise<OdometerReading> {
  try {
    const response = await client.put<OdometerReading>(
      `/api/leases/${leaseId}/readings/${readingId}`,
      data,
    );
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function deleteReading(leaseId: string, readingId: string): Promise<void> {
  try {
    await client.delete(`/api/leases/${leaseId}/readings/${readingId}`);
  } catch (error) {
    throw normalizeError(error);
  }
}
