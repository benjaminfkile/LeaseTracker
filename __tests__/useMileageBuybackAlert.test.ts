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
  getAlertConfigs: jest.fn(),
}));

jest.mock('../src/stores/leasesStore');

import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee from '@notifee/react-native';
import { getLeaseSummary } from '../src/api/leaseApi';
import { getAlertConfigs } from '../src/api/alertsApi';
import {
  computeProjectedOverageCost,
  buildNotificationBody,
} from '../src/hooks/useMileageBuybackAlert';
import type { AlertConfig, LeaseSummary } from '../src/types/api';

const mockGetLeaseSummary = getLeaseSummary as jest.Mock;
const mockGetAlertConfigs = getAlertConfigs as jest.Mock;
const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;

const mockSummaryOverPace: LeaseSummary = {
  miles_driven: 30000,
  miles_remaining: 6000,
  days_elapsed: 916,
  days_remaining: 180,
  lease_length_days: 1096,
  expected_miles_to_date: 30073,
  current_pace_per_month: 982,
  pace_status: 'ahead',
  miles_over_under_pace: -73,
  projected_miles_at_end: 40000,
  projected_overage: 4000,
  projected_overage_cost: 1000,
  recommended_daily_miles: 33,
  reserved_trip_miles: 0,
  is_premium: false,
};

const mockSummaryOnPace: LeaseSummary = {
  miles_driven: 20000,
  miles_remaining: 16000,
  days_elapsed: 731,
  days_remaining: 365,
  lease_length_days: 1096,
  expected_miles_to_date: 24000,
  current_pace_per_month: 821,
  pace_status: 'behind',
  miles_over_under_pace: -4000,
  projected_miles_at_end: 34000,
  projected_overage: 0,
  projected_overage_cost: 0,
  recommended_daily_miles: 44,
  reserved_trip_miles: 0,
  is_premium: false,
};

const mockAlertConfig: AlertConfig = {
  id: 'config-1',
  lease_id: 'lease-1',
  user_id: 'user-1',
  alert_type: 'over_pace',
  threshold_value: 10,
  is_enabled: true,
  last_sent_at: null,
  created_at: '2023-01-01T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('computeProjectedOverageCost', () => {
  it('returns 0 when projected miles are under the limit', () => {
    const cost = computeProjectedOverageCost(mockSummaryOnPace, 36000);
    expect(cost).toBe(0);
  });

  it('computes overage cost at $0.25/mi when over pace', () => {
    // 40000 - 36000 = 4000 overage × $0.25 = $1000
    const cost = computeProjectedOverageCost(mockSummaryOverPace, 36000);
    expect(cost).toBe(1000);
  });

  it('returns 0 when projected equals total', () => {
    const summary = { ...mockSummaryOnPace, projected_miles_at_end: 36000 };
    const cost = computeProjectedOverageCost(summary, 36000);
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
