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
import { getTrips, createTrip, updateTrip, deleteTrip } from '../src/api/tripsApi';
import type { SavedTrip, CreateTripInput, UpdateTripInput } from '../src/types/api';

const mockTrip1: SavedTrip = {
  id: 'trip-1',
  lease_id: 'lease-1',
  user_id: 'user-1',
  name: 'Grocery run',
  estimated_miles: 25.4,
  trip_date: '2024-03-01',
  notes: 'Grocery run',
  is_completed: false,
  created_at: '2024-03-01T10:00:00Z',
  updated_at: '2024-03-01T10:00:00Z',
};

const mockTrip2: SavedTrip = {
  id: 'trip-2',
  lease_id: 'lease-1',
  user_id: 'user-1',
  name: 'Commute',
  estimated_miles: 10.2,
  trip_date: '2024-03-05',
  notes: null,
  is_completed: false,
  created_at: '2024-03-05T08:00:00Z',
  updated_at: '2024-03-05T08:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── getTrips ─────────────────────────────────────────────────────────────────

describe('getTrips', () => {
  it('returns active and completed trip arrays on success', async () => {
    (client.get as jest.Mock).mockResolvedValue({
      data: { active: [mockTrip1], completed: [mockTrip2] },
    });

    const result = await getTrips('lease-1');

    expect(client.get).toHaveBeenCalledWith('/api/leases/lease-1/trips');
    expect(result).toEqual({ active: [mockTrip1], completed: [mockTrip2] });
  });

  it('returns empty arrays when no trips exist', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: { active: [], completed: [] } });

    const result = await getTrips('lease-1');

    expect(result).toEqual({ active: [], completed: [] });
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Network Error');
    (client.get as jest.Mock).mockRejectedValue(error);

    await expect(getTrips('lease-1')).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});

// ─── createTrip ───────────────────────────────────────────────────────────────

describe('createTrip', () => {
  const input: CreateTripInput = {
    name: 'Grocery run',
    estimated_miles: 25.4,
    trip_date: '2024-03-01',
    notes: 'Grocery run',
  };

  it('returns the created trip on success', async () => {
    (client.post as jest.Mock).mockResolvedValue({ data: mockTrip1 });

    const result = await createTrip('lease-1', input);

    expect(client.post).toHaveBeenCalledWith('/api/leases/lease-1/trips', input);
    expect(result).toEqual(mockTrip1);
  });

  it('works without optional note', async () => {
    const inputWithoutNote: CreateTripInput = { name: 'Commute', estimated_miles: 10.2, trip_date: '2024-03-05' };
    const tripWithoutNote: SavedTrip = { ...mockTrip2, notes: null };
    (client.post as jest.Mock).mockResolvedValue({ data: tripWithoutNote });

    const result = await createTrip('lease-1', inputWithoutNote);

    expect(client.post).toHaveBeenCalledWith('/api/leases/lease-1/trips', inputWithoutNote);
    expect(result.notes).toBeNull();
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Validation Error');
    (client.post as jest.Mock).mockRejectedValue(error);

    await expect(createTrip('lease-1', input)).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});

// ─── updateTrip ───────────────────────────────────────────────────────────────

describe('updateTrip', () => {
  const patch: UpdateTripInput = { estimated_miles: 30.0, notes: 'Updated note' };
  const updatedTrip: SavedTrip = { ...mockTrip1, estimated_miles: 30.0, notes: 'Updated note' };

  it('returns the updated trip on success', async () => {
    (client.put as jest.Mock).mockResolvedValue({ data: updatedTrip });

    const result = await updateTrip('lease-1', 'trip-1', patch);

    expect(client.put).toHaveBeenCalledWith('/api/leases/lease-1/trips/trip-1', patch);
    expect(result).toEqual(updatedTrip);
  });

  it('accepts an empty patch object', async () => {
    (client.put as jest.Mock).mockResolvedValue({ data: mockTrip1 });

    const result = await updateTrip('lease-1', 'trip-1', {});

    expect(client.put).toHaveBeenCalledWith('/api/leases/lease-1/trips/trip-1', {});
    expect(result).toEqual(mockTrip1);
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Server Error');
    (client.put as jest.Mock).mockRejectedValue(error);

    await expect(updateTrip('lease-1', 'trip-1', patch)).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});

// ─── deleteTrip ───────────────────────────────────────────────────────────────

describe('deleteTrip', () => {
  it('resolves without a value on success', async () => {
    (client.delete as jest.Mock).mockResolvedValue({ data: undefined });

    const result = await deleteTrip('lease-1', 'trip-1');

    expect(client.delete).toHaveBeenCalledWith('/api/leases/lease-1/trips/trip-1');
    expect(result).toBeUndefined();
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Forbidden');
    (client.delete as jest.Mock).mockRejectedValue(error);

    await expect(deleteTrip('lease-1', 'trip-1')).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});
