jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn().mockResolvedValue('mileage-buyback'),
    displayNotification: jest.fn().mockResolvedValue(undefined),
  },
  AndroidImportance: { HIGH: 4 },
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: jest.fn(() => ({ invalidateQueries: jest.fn() })),
}));

jest.mock('../src/api/leaseApi', () => ({
  getLeaseSummary: jest.fn(),
}));

jest.mock('../src/api/alertsApi', () => ({
  getAlertConfig: jest.fn(),
}));

jest.mock('../src/stores/leasesStore');

import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee from '@notifee/react-native';
import { getLeaseSummary } from '../src/api/leaseApi';
import { getAlertConfig } from '../src/api/alertsApi';
import {
  computeProjectedOverageCost,
  buildNotificationBody,
} from '../src/hooks/useMileageBuybackAlert';
import type { AlertConfig, LeaseSummary } from '../src/types/api';

const mockGetLeaseSummary = getLeaseSummary as jest.Mock;
const mockGetAlertConfig = getAlertConfig as jest.Mock;
const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;

const mockSummaryOverPace: LeaseSummary = {
  leaseId: 'lease-1',
  vehicleLabel: '2023 Toyota Camry',
  startDate: '2023-01-01',
  endDate: '2026-01-01',
  totalMiles: 36000,
  milesUsed: 30000,
  milesRemaining: 6000,
  daysRemaining: 180,
  projectedMiles: 40000,
  isOverPace: true,
};

const mockSummaryOnPace: LeaseSummary = {
  leaseId: 'lease-1',
  vehicleLabel: '2023 Toyota Camry',
  startDate: '2023-01-01',
  endDate: '2026-01-01',
  totalMiles: 36000,
  milesUsed: 20000,
  milesRemaining: 16000,
  daysRemaining: 365,
  projectedMiles: 34000,
  isOverPace: false,
};

const mockAlertConfig: AlertConfig = {
  id: 'config-1',
  leaseId: 'lease-1',
  overPaceThresholdPercent: 10,
  projectedOverageThresholdMiles: 500,
  notifyEmail: true,
  notifyPush: true,
  approachingLimitEnabled: true,
  approachingLimitPercent: 80,
  overPaceEnabled: false,
  leaseEndEnabled: true,
  leaseEndDays: 30,
  savedTripEnabled: false,
  mileageBuybackEnabled: true,
  mileageBuybackThresholdDollars: 50,
  weeklySummaryEnabled: false,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('computeProjectedOverageCost', () => {
  it('returns 0 when projected miles are under the limit', () => {
    const cost = computeProjectedOverageCost(mockSummaryOnPace);
    expect(cost).toBe(0);
  });

  it('computes overage cost at $0.25/mi when over pace', () => {
    // 40000 - 36000 = 4000 overage × $0.25 = $1000
    const cost = computeProjectedOverageCost(mockSummaryOverPace);
    expect(cost).toBe(1000);
  });

  it('returns 0 when projected equals total', () => {
    const summary = { ...mockSummaryOnPace, projectedMiles: 36000, totalMiles: 36000 };
    const cost = computeProjectedOverageCost(summary);
    expect(cost).toBe(0);
  });
});

describe('buildNotificationBody', () => {
  it('builds the correct notification message with rounded dollar amount', () => {
    const body = buildNotificationBody(123.75);
    expect(body).toBe(
      "You're on track to owe ~$124 at turn-in. Consider buying miles now.",
    );
  });

  it('builds message for small amounts', () => {
    const body = buildNotificationBody(50);
    expect(body).toBe(
      "You're on track to owe ~$50 at turn-in. Consider buying miles now.",
    );
  });
});
