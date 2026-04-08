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
import { getAlertConfig, updateAlertConfig } from '../src/api/alertsApi';
import type { AlertConfig, UpdateAlertConfigInput } from '../src/types/api';

const mockAlertConfig: AlertConfig = {
  id: 'alert-1',
  leaseId: 'lease-1',
  overPaceThresholdPercent: 10,
  projectedOverageThresholdMiles: 500,
  notifyEmail: true,
  notifyPush: false,
  approachingLimitEnabled: false,
  approachingLimitPercent: 80,
  overPaceEnabled: false,
  leaseEndEnabled: false,
  leaseEndDays: 30,
  savedTripEnabled: false,
  mileageBuybackEnabled: false,
  mileageBuybackThresholdDollars: 50,
  weeklySummaryEnabled: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getAlertConfig ──────────────────────────────────────────────────────────

describe('getAlertConfig', () => {
  it('returns the alert config for a lease on success', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: mockAlertConfig });

    const result = await getAlertConfig('lease-1');

    expect(client.get).toHaveBeenCalledWith('/leases/lease-1/alerts');
    expect(result).toEqual(mockAlertConfig);
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Network Error');
    (client.get as jest.Mock).mockRejectedValue(error);

    await expect(getAlertConfig('lease-1')).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});

// ─── updateAlertConfig ───────────────────────────────────────────────────────

describe('updateAlertConfig', () => {
  it('returns the updated alert config on success', async () => {
    const patch: UpdateAlertConfigInput = { notifyPush: true };
    const updatedConfig: AlertConfig = { ...mockAlertConfig, notifyPush: true };
    (client.put as jest.Mock).mockResolvedValue({ data: updatedConfig });

    const result = await updateAlertConfig('lease-1', patch);

    expect(client.put).toHaveBeenCalledWith('/leases/lease-1/alerts', patch);
    expect(result).toEqual(updatedConfig);
  });

  it('accepts a full update payload', async () => {
    const patch: UpdateAlertConfigInput = {
      overPaceThresholdPercent: 15,
      projectedOverageThresholdMiles: 300,
      notifyEmail: false,
      notifyPush: true,
    };
    const updatedConfig: AlertConfig = { ...mockAlertConfig, ...patch };
    (client.put as jest.Mock).mockResolvedValue({ data: updatedConfig });

    const result = await updateAlertConfig('lease-1', patch);

    expect(client.put).toHaveBeenCalledWith('/leases/lease-1/alerts', patch);
    expect(result).toEqual(updatedConfig);
  });

  it('accepts an empty patch object', async () => {
    (client.put as jest.Mock).mockResolvedValue({ data: mockAlertConfig });

    const result = await updateAlertConfig('lease-1', {});

    expect(client.put).toHaveBeenCalledWith('/leases/lease-1/alerts', {});
    expect(result).toEqual(mockAlertConfig);
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Server Error');
    (client.put as jest.Mock).mockRejectedValue(error);

    await expect(updateAlertConfig('lease-1', { notifyEmail: true })).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});
