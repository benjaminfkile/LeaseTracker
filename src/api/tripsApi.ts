import client, { normalizeError } from './client';
import type { SavedTrip, CreateTripInput, UpdateTripInput } from '../types/api';

export async function getTrips(
  leaseId: string,
): Promise<{ active: SavedTrip[]; completed: SavedTrip[] }> {
  try {
    const response = await client.get<{ active: SavedTrip[]; completed: SavedTrip[] }>(
      `/api/leases/${leaseId}/trips`,
    );
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function createTrip(leaseId: string, data: CreateTripInput): Promise<SavedTrip> {
  try {
    const response = await client.post<SavedTrip>(`/api/leases/${leaseId}/trips`, data);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function updateTrip(
  leaseId: string,
  tripId: string,
  data: UpdateTripInput,
): Promise<SavedTrip> {
  try {
    const response = await client.put<SavedTrip>(`/api/leases/${leaseId}/trips/${tripId}`, data);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function deleteTrip(leaseId: string, tripId: string): Promise<void> {
  try {
    await client.delete(`/api/leases/${leaseId}/trips/${tripId}`);
  } catch (error) {
    throw normalizeError(error);
  }
}
