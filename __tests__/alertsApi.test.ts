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
import { getAlertConfigs, updateAlertConfig } from '../src/api/alertsApi';
import type { AlertConfig, UpdateAlertConfigInput } from '../src/types/api';

const mockAlertConfigs: AlertConfig[] = [
  {
    id: 'alert-1',
    lease_id: 'lease-1',
    user_id: 'user-1',
    alert_type: 'miles_threshold',
    threshold_value: 1000,
    is_enabled: true,
    last_sent_at: null,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'alert-2',
    lease_id: 'lease-1',
    user_id: 'user-1',
    alert_type: 'over_pace',
    threshold_value: null,
    is_enabled: false,
    last_sent_at: null,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'alert-3',
    lease_id: 'lease-1',
    user_id: 'user-1',
    alert_type: 'days_remaining',
    threshold_value: 30,
    is_enabled: true,
    last_sent_at: '2024-06-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getAlertConfigs ─────────────────────────────────────────────────────────

describe('getAlertConfigs', () => {
  it('returns all alert configs for a lease on success', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: mockAlertConfigs });

    const result = await getAlertConfigs('lease-1');

    expect(client.get).toHaveBeenCalledWith('/api/leases/lease-1/alerts');
    expect(result).toEqual(mockAlertConfigs);
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Network Error');
    (client.get as jest.Mock).mockRejectedValue(error);

    await expect(getAlertConfigs('lease-1')).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});

// ─── updateAlertConfig ───────────────────────────────────────────────────────

describe('updateAlertConfig', () => {
  it('returns the updated alert config on success', async () => {
    const patch: UpdateAlertConfigInput = { is_enabled: true };
    const updatedConfig: AlertConfig = { ...mockAlertConfigs[0], is_enabled: true };
    (client.put as jest.Mock).mockResolvedValue({ data: updatedConfig });

    const result = await updateAlertConfig('lease-1', 'alert-1', patch);

    expect(client.put).toHaveBeenCalledWith('/api/leases/lease-1/alerts/alert-1', patch);
    expect(result).toEqual(updatedConfig);
  });

  it('accepts a threshold_value update', async () => {
    const patch: UpdateAlertConfigInput = { threshold_value: 500 };
    const updatedConfig: AlertConfig = { ...mockAlertConfigs[0], threshold_value: 500 };
    (client.put as jest.Mock).mockResolvedValue({ data: updatedConfig });

    const result = await updateAlertConfig('lease-1', 'alert-1', patch);

    expect(client.put).toHaveBeenCalledWith('/api/leases/lease-1/alerts/alert-1', patch);
    expect(result).toEqual(updatedConfig);
  });

  it('accepts an empty patch object', async () => {
    (client.put as jest.Mock).mockResolvedValue({ data: mockAlertConfigs[0] });

    const result = await updateAlertConfig('lease-1', 'alert-1', {});

    expect(client.put).toHaveBeenCalledWith('/api/leases/lease-1/alerts/alert-1', {});
    expect(result).toEqual(mockAlertConfigs[0]);
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Server Error');
    (client.put as jest.Mock).mockRejectedValue(error);

    await expect(updateAlertConfig('lease-1', 'alert-1', { is_enabled: true })).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});
