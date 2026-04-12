import client, { normalizeError } from './client';
import type { User, UpdateUserInput } from '../types/api';

export async function getMe(): Promise<User> {
  try {
    const response = await client.get<User>('/api/users/me');
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function updateMe(data: UpdateUserInput): Promise<User> {
  try {
    const response = await client.put<User>('/api/users/me', data);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function savePushToken(token: string): Promise<void> {
  try {
    await client.patch('/api/users/me/push-token', { push_token: token });
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function deleteAccount(): Promise<void> {
  try {
    await client.delete('/api/users/me');
  } catch (error) {
    throw normalizeError(error);
  }
}
