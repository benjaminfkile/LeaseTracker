jest.mock('react-native-config', () => ({
  API_BASE_URL: 'https://api.test.com',
}));

jest.mock('../src/api/client', () => {
  class ApiError extends Error {
    readonly statusCode: number | null;
    readonly details?: unknown;
    constructor(message: string, statusCode: number | null, details?: unknown) {
      super(message);
      this.name = 'ApiError';
      this.statusCode = statusCode;
      this.details = details;
    }
  }

  const mock = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  };

  return {
    __esModule: true,
    default: mock,
    ApiError,
    normalizeError: jest.fn((error: unknown) => {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      return new ApiError(message, null);
    }),
  };
});

import client, { ApiError, normalizeError } from '../src/api/client';
import { getMe, updateMe, savePushToken, deleteAccount } from '../src/api/userApi';
import type { User, UpdateUserInput } from '../src/types/api';

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  display_name: 'John Doe',
  subscription_tier: 'free',
  subscription_expires_at: null,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getMe ───────────────────────────────────────────────────────────────────

describe('getMe', () => {
  it('returns the authenticated user on success', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: mockUser });

    const result = await getMe();

    expect(client.get).toHaveBeenCalledWith('/api/users/me');
    expect(result).toEqual(mockUser);
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Unauthorized');
    (client.get as jest.Mock).mockRejectedValue(error);

    await expect(getMe()).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});

// ─── updateMe ────────────────────────────────────────────────────────────────

describe('updateMe', () => {
  const patch: UpdateUserInput = { display_name: 'Jane Doe' };
  const updatedUser: User = { ...mockUser, display_name: 'Jane Doe' };

  it('returns the updated user on success', async () => {
    (client.put as jest.Mock).mockResolvedValue({ data: updatedUser });

    const result = await updateMe(patch);

    expect(client.put).toHaveBeenCalledWith('/api/users/me', patch);
    expect(result).toEqual(updatedUser);
  });

  it('accepts an empty patch object', async () => {
    (client.put as jest.Mock).mockResolvedValue({ data: mockUser });

    const result = await updateMe({});

    expect(client.put).toHaveBeenCalledWith('/api/users/me', {});
    expect(result).toEqual(mockUser);
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Validation Error');
    (client.put as jest.Mock).mockRejectedValue(error);

    await expect(updateMe(patch)).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});

// ─── savePushToken ────────────────────────────────────────────────────────────

describe('savePushToken', () => {
  it('resolves without a value on success', async () => {
    (client.patch as jest.Mock).mockResolvedValue({ data: undefined });

    const result = await savePushToken('fcm-token-abc');

    expect(client.patch).toHaveBeenCalledWith('/api/users/me/push-token', { push_token: 'fcm-token-abc' });
    expect(result).toBeUndefined();
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Server Error');
    (client.patch as jest.Mock).mockRejectedValue(error);

    await expect(savePushToken('fcm-token-abc')).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});

// ─── deleteAccount ────────────────────────────────────────────────────────────

describe('deleteAccount', () => {
  it('resolves without a value on success', async () => {
    (client.delete as jest.Mock).mockResolvedValue({ data: undefined });

    const result = await deleteAccount();

    expect(client.delete).toHaveBeenCalledWith('/api/users/me');
    expect(result).toBeUndefined();
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Forbidden');
    (client.delete as jest.Mock).mockRejectedValue(error);

    await expect(deleteAccount()).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});
