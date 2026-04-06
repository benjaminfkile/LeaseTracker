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
  getLeases,
  getLease,
  createLease,
  updateLease,
  deleteLease,
  getLeaseSummary,
  getMileageHistory,
} from '../src/api/leaseApi';
import type { Lease, LeaseSummary, MileageHistory, CreateLeaseInput, UpdateLeaseInput } from '../src/types/api';

const mockLease: Lease = {
  id: 'lease-1',
  userId: 'user-1',
  vehicleYear: 2023,
  vehicleMake: 'Toyota',
  vehicleModel: 'Camry',
  vehicleTrim: 'SE',
  startDate: '2023-01-01',
  endDate: '2026-01-01',
  totalMiles: 36000,
  startingMileage: 10,
  currentMileage: 12000,
  monthlyMiles: 1000,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockSummary: LeaseSummary = {
  leaseId: 'lease-1',
  vehicleLabel: '2023 Toyota Camry SE',
  startDate: '2023-01-01',
  endDate: '2026-01-01',
  totalMiles: 36000,
  milesUsed: 12000,
  milesRemaining: 24000,
  daysRemaining: 365,
  projectedMiles: 13000,
  isOverPace: true,
};

const mockHistory: MileageHistory = {
  leaseId: 'lease-1',
  entries: [
    { date: '2023-02-01', mileage: 1000, projectedMileage: 1000 },
    { date: '2023-03-01', mileage: 2100, projectedMileage: 2000 },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getLeases ───────────────────────────────────────────────────────────────

describe('getLeases', () => {
  it('returns an array of leases on success', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: [mockLease] });

    const result = await getLeases();

    expect(client.get).toHaveBeenCalledWith('/leases');
    expect(result).toEqual([mockLease]);
  });

  it('returns an empty array when no leases exist', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: [] });

    const result = await getLeases();

    expect(result).toEqual([]);
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Network Error');
    (client.get as jest.Mock).mockRejectedValue(error);

    await expect(getLeases()).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});

// ─── getLease ────────────────────────────────────────────────────────────────

describe('getLease', () => {
  it('returns a single lease on success', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: mockLease });

    const result = await getLease('lease-1');

    expect(client.get).toHaveBeenCalledWith('/leases/lease-1');
    expect(result).toEqual(mockLease);
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Not Found');
    (client.get as jest.Mock).mockRejectedValue(error);

    await expect(getLease('lease-1')).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});

// ─── createLease ─────────────────────────────────────────────────────────────

describe('createLease', () => {
  const input: CreateLeaseInput = {
    vehicleYear: 2023,
    vehicleMake: 'Toyota',
    vehicleModel: 'Camry',
    vehicleTrim: 'SE',
    startDate: '2023-01-01',
    endDate: '2026-01-01',
    totalMiles: 36000,
    startingMileage: 10,
    monthlyMiles: 1000,
  };

  it('returns the created lease on success', async () => {
    (client.post as jest.Mock).mockResolvedValue({ data: mockLease });

    const result = await createLease(input);

    expect(client.post).toHaveBeenCalledWith('/leases', input);
    expect(result).toEqual(mockLease);
  });

  it('works without optional vehicleTrim', async () => {
    const inputWithoutTrim: CreateLeaseInput = { ...input, vehicleTrim: undefined };
    (client.post as jest.Mock).mockResolvedValue({ data: { ...mockLease, vehicleTrim: undefined } });

    const result = await createLease(inputWithoutTrim);

    expect(client.post).toHaveBeenCalledWith('/leases', inputWithoutTrim);
    expect(result.vehicleTrim).toBeUndefined();
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Validation Error');
    (client.post as jest.Mock).mockRejectedValue(error);

    await expect(createLease(input)).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});

// ─── updateLease ─────────────────────────────────────────────────────────────

describe('updateLease', () => {
  const patch: UpdateLeaseInput = { vehicleModel: 'Corolla', totalMiles: 40000 };
  const updatedLease: Lease = { ...mockLease, vehicleModel: 'Corolla', totalMiles: 40000 };

  it('returns the updated lease on success', async () => {
    (client.put as jest.Mock).mockResolvedValue({ data: updatedLease });

    const result = await updateLease('lease-1', patch);

    expect(client.put).toHaveBeenCalledWith('/leases/lease-1', patch);
    expect(result).toEqual(updatedLease);
  });

  it('accepts an empty patch object', async () => {
    (client.put as jest.Mock).mockResolvedValue({ data: mockLease });

    const result = await updateLease('lease-1', {});

    expect(client.put).toHaveBeenCalledWith('/leases/lease-1', {});
    expect(result).toEqual(mockLease);
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Server Error');
    (client.put as jest.Mock).mockRejectedValue(error);

    await expect(updateLease('lease-1', patch)).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});

// ─── deleteLease ─────────────────────────────────────────────────────────────

describe('deleteLease', () => {
  it('resolves without a value on success', async () => {
    (client.delete as jest.Mock).mockResolvedValue({ data: undefined });

    const result = await deleteLease('lease-1');

    expect(client.delete).toHaveBeenCalledWith('/leases/lease-1');
    expect(result).toBeUndefined();
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Forbidden');
    (client.delete as jest.Mock).mockRejectedValue(error);

    await expect(deleteLease('lease-1')).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});

// ─── getLeaseSummary ──────────────────────────────────────────────────────────

describe('getLeaseSummary', () => {
  it('returns a LeaseSummary on success', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: mockSummary });

    const result = await getLeaseSummary('lease-1');

    expect(client.get).toHaveBeenCalledWith('/leases/lease-1/summary');
    expect(result).toEqual(mockSummary);
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Not Found');
    (client.get as jest.Mock).mockRejectedValue(error);

    await expect(getLeaseSummary('lease-1')).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});

// ─── getMileageHistory ────────────────────────────────────────────────────────

describe('getMileageHistory', () => {
  it('returns MileageHistory on success', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: mockHistory });

    const result = await getMileageHistory('lease-1');

    expect(client.get).toHaveBeenCalledWith('/leases/lease-1/mileage-history');
    expect(result).toEqual(mockHistory);
  });

  it('returns MileageHistory with an empty entries array', async () => {
    const emptyHistory: MileageHistory = { leaseId: 'lease-1', entries: [] };
    (client.get as jest.Mock).mockResolvedValue({ data: emptyHistory });

    const result = await getMileageHistory('lease-1');

    expect(result.entries).toHaveLength(0);
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Server Error');
    (client.get as jest.Mock).mockRejectedValue(error);

    await expect(getMileageHistory('lease-1')).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});
