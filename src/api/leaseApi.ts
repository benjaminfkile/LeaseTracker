import client, { normalizeError } from './client';
import type {
  Lease,
  LeaseMember,
  LeaseSummary,
  MileageHistory,
  CreateLeaseInput,
  UpdateLeaseInput,
  InviteMemberInput,
} from '../types/api';

export async function getLeases(): Promise<Lease[]> {
  try {
    const response = await client.get<Lease[]>('/api/leases');
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getLease(id: string): Promise<Lease> {
  try {
    const response = await client.get<Lease>(`/api/leases/${id}`);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function createLease(data: CreateLeaseInput): Promise<Lease> {
  try {
    const response = await client.post<Lease>('/api/leases', data);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function updateLease(id: string, data: UpdateLeaseInput): Promise<Lease> {
  try {
    const response = await client.put<Lease>(`/api/leases/${id}`, data);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function deleteLease(id: string): Promise<void> {
  try {
    await client.delete(`/api/leases/${id}`);
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getLeaseSummary(id: string): Promise<LeaseSummary> {
  try {
    const response = await client.get<LeaseSummary>(`/api/leases/${id}/summary`);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getMileageHistory(id: string): Promise<MileageHistory> {
  try {
    const response = await client.get<MileageHistory>(`/api/leases/${id}/mileage-history`);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getLeaseMembers(id: string): Promise<LeaseMember[]> {
  try {
    const response = await client.get<LeaseMember[]>(`/api/leases/${id}/members`);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function inviteLeaseMember(
  leaseId: string,
  data: InviteMemberInput,
): Promise<LeaseMember> {
  try {
    const response = await client.post<LeaseMember>(`/api/leases/${leaseId}/members`, data);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function removeLeaseMember(
  leaseId: string,
  memberId: string,
): Promise<void> {
  try {
    await client.delete(`/api/leases/${leaseId}/members/${memberId}`);
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function acceptLeaseInvite(leaseId: string): Promise<LeaseMember> {
  try {
    const response = await client.post<LeaseMember>(`/api/leases/${leaseId}/accept-invite`);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}
