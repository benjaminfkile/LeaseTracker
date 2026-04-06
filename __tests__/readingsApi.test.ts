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
  PaginationParams,
} from '../src/types/api';

const mockReading: OdometerReading = {
  id: 'reading-1',
  leaseId: 'lease-1',
  mileage: 15000,
  readingDate: '2024-03-01',
  note: 'Monthly check',
  createdAt: '2024-03-01T10:00:00Z',
};

const mockReading2: OdometerReading = {
  id: 'reading-2',
  leaseId: 'lease-1',
  mileage: 16000,
  readingDate: '2024-04-01',
  createdAt: '2024-04-01T10:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getReadings ─────────────────────────────────────────────────────────────

describe('getReadings', () => {
  it('returns an array of readings on success', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: [mockReading, mockReading2] });

    const result = await getReadings('lease-1');

    expect(client.get).toHaveBeenCalledWith('/leases/lease-1/readings', { params: undefined });
    expect(result).toEqual([mockReading, mockReading2]);
  });

  it('returns an empty array when no readings exist', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: [] });

    const result = await getReadings('lease-1');

    expect(result).toEqual([]);
  });

  it('passes pagination params to the request', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: [mockReading] });
    const params: PaginationParams = { page: 2, limit: 10 };

    const result = await getReadings('lease-1', params);

    expect(client.get).toHaveBeenCalledWith('/leases/lease-1/readings', { params });
    expect(result).toEqual([mockReading]);
  });

  it('works with only page param provided', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: [mockReading] });
    const params: PaginationParams = { page: 1 };

    await getReadings('lease-1', params);

    expect(client.get).toHaveBeenCalledWith('/leases/lease-1/readings', { params });
  });

  it('works with only limit param provided', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: [mockReading] });
    const params: PaginationParams = { limit: 5 };

    await getReadings('lease-1', params);

    expect(client.get).toHaveBeenCalledWith('/leases/lease-1/readings', { params });
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
    mileage: 15000,
    readingDate: '2024-03-01',
    note: 'Monthly check',
  };

  it('returns the created reading on success', async () => {
    (client.post as jest.Mock).mockResolvedValue({ data: mockReading });

    const result = await addReading('lease-1', input);

    expect(client.post).toHaveBeenCalledWith('/leases/lease-1/readings', input);
    expect(result).toEqual(mockReading);
  });

  it('works without optional note', async () => {
    const inputWithoutNote: CreateReadingInput = { mileage: 15000, readingDate: '2024-03-01' };
    const readingWithoutNote: OdometerReading = { ...mockReading, note: undefined };
    (client.post as jest.Mock).mockResolvedValue({ data: readingWithoutNote });

    const result = await addReading('lease-1', inputWithoutNote);

    expect(client.post).toHaveBeenCalledWith('/leases/lease-1/readings', inputWithoutNote);
    expect(result.note).toBeUndefined();
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
  const patch: UpdateReadingInput = { mileage: 15500, note: 'Corrected mileage' };
  const updatedReading: OdometerReading = { ...mockReading, mileage: 15500, note: 'Corrected mileage' };

  it('returns the updated reading on success', async () => {
    (client.put as jest.Mock).mockResolvedValue({ data: updatedReading });

    const result = await updateReading('lease-1', 'reading-1', patch);

    expect(client.put).toHaveBeenCalledWith('/leases/lease-1/readings/reading-1', patch);
    expect(result).toEqual(updatedReading);
  });

  it('accepts an empty patch object', async () => {
    (client.put as jest.Mock).mockResolvedValue({ data: mockReading });

    const result = await updateReading('lease-1', 'reading-1', {});

    expect(client.put).toHaveBeenCalledWith('/leases/lease-1/readings/reading-1', {});
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

    expect(client.delete).toHaveBeenCalledWith('/leases/lease-1/readings/reading-1');
    expect(result).toBeUndefined();
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Forbidden');
    (client.delete as jest.Mock).mockRejectedValue(error);

    await expect(deleteReading('lease-1', 'reading-1')).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});
