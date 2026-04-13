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
import {
  getReadings,
  addReading,
  updateReading,
  deleteReading,
} from '../src/api/readingsApi';
import type {
  OdometerReading,
  CreateReadingInput,
  UpdateReadingInput,
} from '../src/types/api';

const mockReading: OdometerReading = {
  id: 'reading-1',
  lease_id: 'lease-1',
  user_id: 'user-1',
  odometer: 15000,
  reading_date: '2024-03-01',
  notes: 'Monthly check',
  source: 'manual',
  created_at: '2024-03-01T10:00:00Z',
};

const mockReading2: OdometerReading = {
  id: 'reading-2',
  lease_id: 'lease-1',
  user_id: 'user-1',
  odometer: 16000,
  reading_date: '2024-04-01',
  notes: null,
  source: 'manual',
  created_at: '2024-04-01T10:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getReadings ─────────────────────────────────────────────────────────────

describe('getReadings', () => {
  it('returns an array of readings on success', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: [mockReading, mockReading2] });

    const result = await getReadings('lease-1');

    expect(client.get).toHaveBeenCalledWith('/api/leases/lease-1/readings', { params: undefined });
    expect(result).toEqual([mockReading, mockReading2]);
  });

  it('returns an empty array when no readings exist', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: [] });

    const result = await getReadings('lease-1');

    expect(result).toEqual([]);
  });

  it('passes pagination params to the request', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: [mockReading] });
    const params = { limit: 10, before: '2024-04-01T00:00:00Z' };

    const result = await getReadings('lease-1', params);

    expect(client.get).toHaveBeenCalledWith('/api/leases/lease-1/readings', { params });
    expect(result).toEqual([mockReading]);
  });

  it('works with only limit param provided', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: [mockReading] });
    const params = { limit: 5 };

    await getReadings('lease-1', params);

    expect(client.get).toHaveBeenCalledWith('/api/leases/lease-1/readings', { params });
  });

  it('works with only before param provided', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: [mockReading] });
    const params = { before: '2024-04-01T00:00:00Z' };

    await getReadings('lease-1', params);

    expect(client.get).toHaveBeenCalledWith('/api/leases/lease-1/readings', { params });
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Network Error');
    (client.get as jest.Mock).mockRejectedValue(error);

    await expect(getReadings('lease-1')).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});

// ─── addReading ──────────────────────────────────────────────────────────────

describe('addReading', () => {
  const input: CreateReadingInput = {
    odometer: 15000,
    reading_date: '2024-03-01',
    notes: 'Monthly check',
  };

  it('returns the created reading on success', async () => {
    (client.post as jest.Mock).mockResolvedValue({ data: mockReading });

    const result = await addReading('lease-1', input);

    expect(client.post).toHaveBeenCalledWith('/api/leases/lease-1/readings', input);
    expect(result).toEqual(mockReading);
  });

  it('works without optional notes', async () => {
    const inputWithoutNotes: CreateReadingInput = { odometer: 15000, reading_date: '2024-03-01' };
    const readingWithoutNotes: OdometerReading = { ...mockReading, notes: null };
    (client.post as jest.Mock).mockResolvedValue({ data: readingWithoutNotes });

    const result = await addReading('lease-1', inputWithoutNotes);

    expect(client.post).toHaveBeenCalledWith('/api/leases/lease-1/readings', inputWithoutNotes);
    expect(result.notes).toBeNull();
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Validation Error');
    (client.post as jest.Mock).mockRejectedValue(error);

    await expect(addReading('lease-1', input)).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});

// ─── updateReading ───────────────────────────────────────────────────────────

describe('updateReading', () => {
  const patch: UpdateReadingInput = { odometer: 15500, notes: 'Corrected mileage' };
  const updatedReading: OdometerReading = { ...mockReading, odometer: 15500, notes: 'Corrected mileage' };

  it('returns the updated reading on success', async () => {
    (client.put as jest.Mock).mockResolvedValue({ data: updatedReading });

    const result = await updateReading('lease-1', 'reading-1', patch);

    expect(client.put).toHaveBeenCalledWith('/api/leases/lease-1/readings/reading-1', patch);
    expect(result).toEqual(updatedReading);
  });

  it('accepts an empty patch object', async () => {
    (client.put as jest.Mock).mockResolvedValue({ data: mockReading });

    const result = await updateReading('lease-1', 'reading-1', {});

    expect(client.put).toHaveBeenCalledWith('/api/leases/lease-1/readings/reading-1', {});
    expect(result).toEqual(mockReading);
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Server Error');
    (client.put as jest.Mock).mockRejectedValue(error);

    await expect(updateReading('lease-1', 'reading-1', patch)).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});

// ─── deleteReading ───────────────────────────────────────────────────────────

describe('deleteReading', () => {
  it('resolves without a value on success', async () => {
    (client.delete as jest.Mock).mockResolvedValue({ data: undefined });

    const result = await deleteReading('lease-1', 'reading-1');

    expect(client.delete).toHaveBeenCalledWith('/api/leases/lease-1/readings/reading-1');
    expect(result).toBeUndefined();
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Forbidden');
    (client.delete as jest.Mock).mockRejectedValue(error);

    await expect(deleteReading('lease-1', 'reading-1')).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});
