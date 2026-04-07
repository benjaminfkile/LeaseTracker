import client, { normalizeError } from './client';
import type { User, UpdateUserInput } from '../types/api';

export async function getMe(): Promise<User> {
  try {
    const response = await client.get<User>('/me');
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function updateMe(data: UpdateUserInput): Promise<User> {
  try {
    const response = await client.put<User>('/me', data);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function savePushToken(token: string): Promise<void> {
  try {
    await client.post('/me/push-token', { token });
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function deleteAccount(): Promise<void> {
  try {
    await client.delete('/me');
  } catch (error) {
    throw normalizeError(error);
  }
}
