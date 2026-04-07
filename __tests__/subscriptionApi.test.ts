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
  verifyApplePurchase,
  verifyGooglePurchase,
  getStatus,
} from '../src/api/subscriptionApi';
import type { SubscriptionStatus } from '../src/types/api';

const mockPremiumIos: SubscriptionStatus = {
  isPremium: true,
  tier: 'premium',
  expiresAt: '2025-01-01T00:00:00Z',
  platform: 'ios',
  productId: 'com.leasetracker.premium.monthly',
};

const mockPremiumAndroid: SubscriptionStatus = {
  isPremium: true,
  tier: 'premium',
  expiresAt: '2025-06-01T00:00:00Z',
  platform: 'android',
  productId: 'com.leasetracker.premium.annual',
};

const mockFree: SubscriptionStatus = {
  isPremium: false,
  tier: 'free',
  expiresAt: null,
  platform: null,
  productId: null,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── verifyApplePurchase ──────────────────────────────────────────────────────

describe('verifyApplePurchase', () => {
  it('returns subscription status on success', async () => {
    (client.post as jest.Mock).mockResolvedValue({ data: mockPremiumIos });

    const result = await verifyApplePurchase('receipt-data-abc');

    expect(client.post).toHaveBeenCalledWith('/subscription/verify/apple', {
      receiptData: 'receipt-data-abc',
    });
    expect(result).toEqual(mockPremiumIos);
  });

  it('returns free status when receipt is invalid', async () => {
    (client.post as jest.Mock).mockResolvedValue({ data: mockFree });

    const result = await verifyApplePurchase('invalid-receipt');

    expect(client.post).toHaveBeenCalledWith('/subscription/verify/apple', {
      receiptData: 'invalid-receipt',
    });
    expect(result).toEqual(mockFree);
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Network Error');
    (client.post as jest.Mock).mockRejectedValue(error);

    await expect(verifyApplePurchase('receipt-data-abc')).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});

// ─── verifyGooglePurchase ─────────────────────────────────────────────────────

describe('verifyGooglePurchase', () => {
  it('returns subscription status on success', async () => {
    (client.post as jest.Mock).mockResolvedValue({ data: mockPremiumAndroid });

    const result = await verifyGooglePurchase(
      'com.leasetracker.premium.annual',
      'purchase-token-xyz',
    );

    expect(client.post).toHaveBeenCalledWith('/subscription/verify/google', {
      productId: 'com.leasetracker.premium.annual',
      purchaseToken: 'purchase-token-xyz',
    });
    expect(result).toEqual(mockPremiumAndroid);
  });

  it('returns free status when purchase token is invalid', async () => {
    (client.post as jest.Mock).mockResolvedValue({ data: mockFree });

    const result = await verifyGooglePurchase('com.leasetracker.premium.monthly', 'bad-token');

    expect(client.post).toHaveBeenCalledWith('/subscription/verify/google', {
      productId: 'com.leasetracker.premium.monthly',
      purchaseToken: 'bad-token',
    });
    expect(result).toEqual(mockFree);
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Server Error');
    (client.post as jest.Mock).mockRejectedValue(error);

    await expect(
      verifyGooglePurchase('com.leasetracker.premium.annual', 'purchase-token-xyz'),
    ).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});

// ─── getStatus ────────────────────────────────────────────────────────────────

describe('getStatus', () => {
  it('returns premium iOS status on success', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: mockPremiumIos });

    const result = await getStatus();

    expect(client.get).toHaveBeenCalledWith('/subscription/status');
    expect(result).toEqual(mockPremiumIos);
  });

  it('returns free status when user has no subscription', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: mockFree });

    const result = await getStatus();

    expect(client.get).toHaveBeenCalledWith('/subscription/status');
    expect(result).toEqual(mockFree);
  });

  it('returns premium Android status on success', async () => {
    (client.get as jest.Mock).mockResolvedValue({ data: mockPremiumAndroid });

    const result = await getStatus();

    expect(result).toEqual(mockPremiumAndroid);
  });

  it('throws a normalized ApiError on failure', async () => {
    const error = new Error('Unauthorized');
    (client.get as jest.Mock).mockRejectedValue(error);

    await expect(getStatus()).rejects.toBeInstanceOf(ApiError);
    expect(normalizeError).toHaveBeenCalledWith(error);
  });
});
