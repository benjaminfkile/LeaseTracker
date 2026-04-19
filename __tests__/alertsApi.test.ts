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
import { getAlerts, createAlert, updateAlert } from '../src/api/alertsApi';
import type {
  AlertConfig,
  CreateAlertConfigInput,
  UpdateAlertConfigInput,
} from '../src/types/api';

const mockAlertConfig: AlertConfig = {
  id: 'alert-1',
  lease_id: 'lease-1',
  user_id: 'user-1',
  alert_type: 'over_pace',
  threshold_value: null,
  is_enabled: false,
  last_sent_at: null,
  created_at: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getAlerts ───────────────────────────────────────────────────────────────

describe('getAlerts', () => {
  it('returns the alert configs for a lease on success', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: [mockAlertConfig] });

    const result = await getAlerts('lease-1');

    expect(client.get).toHaveBeenCalledWith('/api/leases/lease-1/alerts');
    expect(result).toEqual([mockAlertConfig]);
  });

  it('returns an empty array when no alerts exist', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: [] });

    const result = await getAlerts('lease-1');

    expect(client.get).toHaveBeenCalledWith('/api/leases/lease-1/alerts');
    expect(result).toEqual([]);
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Network Error');
    (client.get as jest.Mock).mockRejectedValue(error);

    await expect(getAlerts('lease-1')).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});

// ─── createAlert ─────────────────────────────────────────────────────────────

describe('createAlert', () => {
  it('returns the created alert on success', async () => {
    const input: CreateAlertConfigInput = {
      alert_type: 'miles_threshold',
      threshold_value: 80,
    };
    const created: AlertConfig = {
      ...mockAlertConfig,
      id: 'alert-2',
      alert_type: 'miles_threshold',
      threshold_value: 80,
    };
    (client.post as jest.Mock).mockResolvedValue({ data: created });

    const result = await createAlert('lease-1', input);

    expect(client.post).toHaveBeenCalledWith('/api/leases/lease-1/alerts', input);
    expect(result).toEqual(created);
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Validation Error');
    (client.post as jest.Mock).mockRejectedValue(error);

    await expect(
      createAlert('lease-1', { alert_type: 'miles_threshold', threshold_value: 80 }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});

// ─── updateAlert ─────────────────────────────────────────────────────────────

describe('updateAlert', () => {
  it('returns the updated alert on success', async () => {
    const patch: UpdateAlertConfigInput = { is_enabled: true };
    const updated: AlertConfig = { ...mockAlertConfig, is_enabled: true };
    (client.put as jest.Mock).mockResolvedValue({ data: updated });

    const result = await updateAlert('lease-1', 'alert-1', patch);

    expect(client.put).toHaveBeenCalledWith('/api/leases/lease-1/alerts/alert-1', patch);
    expect(result).toEqual(updated);
  });

  it('accepts an empty patch object', async () => {
    (client.put as jest.Mock).mockResolvedValue({ data: mockAlertConfig });

    const result = await updateAlert('lease-1', 'alert-1', {});

    expect(client.put).toHaveBeenCalledWith('/api/leases/lease-1/alerts/alert-1', {});
    expect(result).toEqual(mockAlertConfig);
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Server Error');
    (client.put as jest.Mock).mockRejectedValue(error);

    await expect(
      updateAlert('lease-1', 'alert-1', { is_enabled: true }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});
