jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  const mockComponent = (name: string) => {
    const Comp = ({
      children,
      testID,
      ...rest
    }: {
      children?: React.ReactNode;
      testID?: string;
      [key: string]: unknown;
    }) => React.createElement(View, { testID: testID ?? name, ...rest }, children);
    Comp.displayName = name;
    return Comp;
  };
  return {
    __esModule: true,
    default: mockComponent('Svg'),
    Svg: mockComponent('Svg'),
    Circle: mockComponent('Circle'),
    G: mockComponent('G'),
  };
});

jest.mock('react-native-gifted-charts', () => ({
  LineChart: 'LineChart',
  BarChart: 'BarChart',
}));

jest.mock('react-native-google-mobile-ads', () => ({
  BannerAd: 'BannerAd',
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
  TestIds: { ADAPTIVE_BANNER: 'ca-app-pub-3940256099942544/2435281174' },
}));

jest.mock('react-native-config', () => ({
  API_BASE_URL: 'https://api.test.com',
  ADMOB_BANNER_UNIT_ID: undefined,
}));

jest.mock('react-native-safe-area-context', () => {
  const MockView = require('react-native').View;
  const MockReact = require('react');
  return {
    SafeAreaView: ({
      children,
      ...props
    }: {
      children?: unknown;
      [key: string]: unknown;
    }) => MockReact.createElement(MockView, props, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
  };
});

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: { leaseId: 'lease-1' },
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('../src/api/leaseApi', () => ({
  getLease: jest.fn(),
  getLeaseSummary: jest.fn(),
  getMileageHistory: jest.fn(),
}));

jest.mock('../src/api/subscriptionApi', () => ({
  getStatus: jest.fn(),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useQuery } from '@tanstack/react-query';
import { PaceDetailScreen, computeDaysForwardBehind } from '../src/screens/home/PaceDetailScreen';
import type { Lease, LeaseSummary, MileageHistory, SubscriptionStatus } from '../src/types/api';

const mockUseQuery = useQuery as jest.Mock;

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
  startingMileage: 0,
  currentMileage: 12000,
  monthlyMiles: 1000,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
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
  projectedMiles: 14000,
  isOverPace: false,
};

const mockHistory: MileageHistory = {
  leaseId: 'lease-1',
  entries: [
    { date: '2023-02-01', mileage: 1000, projectedMileage: 1000 },
    { date: '2023-03-01', mileage: 2100, projectedMileage: 2000 },
    { date: '2023-04-01', mileage: 3050, projectedMileage: 3000 },
  ],
};

const mockSubscription: SubscriptionStatus = {
  isPremium: false,
  tier: 'free',
  expiresAt: null,
  platform: null,
  productId: null,
};

function setupQueryMocks({
  lease = mockLease,
  summary = mockSummary,
  history = mockHistory,
  subscription = mockSubscription,
  leaseLoading = false,
  summaryLoading = false,
  historyLoading = false,
  leaseError = null,
}: {
  lease?: Lease | null;
  summary?: LeaseSummary | null;
  history?: MileageHistory | null;
  subscription?: SubscriptionStatus;
  leaseLoading?: boolean;
  summaryLoading?: boolean;
  historyLoading?: boolean;
  leaseError?: Error | null;
} = {}) {
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    const key = queryKey[0];
    if (key === 'lease') {
      return { data: lease, isLoading: leaseLoading, error: leaseError };
    }
    if (key === 'lease-summary') {
      return { data: summary, isLoading: summaryLoading };
    }
    if (key === 'mileage-history') {
      return { data: history, isLoading: historyLoading };
    }
    if (key === 'subscription-status') {
      return { data: subscription };
    }
    return { data: undefined, isLoading: false };
  });
}

describe('PaceDetailScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setupQueryMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<PaceDetailScreen />);
    });
  });

  it('renders with testID pace-detail-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'pace-detail-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Pace & Analytics title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'pace-detail-title' });
    expect(title).toBeDefined();
    expect(title.props.children).toBe('Pace & Analytics');
  });

  it('shows loading indicator when data is loading', async () => {
    setupQueryMocks({ leaseLoading: true });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const loading = renderer!.root.findByProps({ testID: 'pace-detail-loading' });
    expect(loading).toBeDefined();
  });

  it('shows error message when lease fails to load', async () => {
    setupQueryMocks({ leaseError: new Error('Network error') });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'pace-detail-screen' });
    expect(screen).toBeDefined();
    // No stats table should be visible
    const tables = renderer!.root.findAllByProps({ testID: 'pace-detail-stats-table' });
    expect(tables.length).toBe(0);
  });

  it('renders the toggle row', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'pace-detail-toggle' });
    expect(toggle).toBeDefined();
  });

  it('renders Full Lease toggle button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const fullLeaseBtn = renderer!.root.findByProps({ testID: 'toggle-full-lease' });
    expect(fullLeaseBtn).toBeDefined();
  });

  it('renders This Year toggle button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const thisYearBtn = renderer!.root.findByProps({ testID: 'toggle-this-year' });
    expect(thisYearBtn).toBeDefined();
  });

  it('renders the projection chart section', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const section = renderer!.root.findByProps({ testID: 'pace-detail-projection-section' });
    expect(section).toBeDefined();
  });

  it('renders the monthly mileage chart section', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const section = renderer!.root.findByProps({ testID: 'pace-detail-monthly-section' });
    expect(section).toBeDefined();
  });

  it('renders the stats table', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const table = renderer!.root.findByProps({ testID: 'pace-detail-stats-table' });
    expect(table).toBeDefined();
  });

  it('renders miles used stat', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const stat = renderer!.root.findByProps({ testID: 'stats-miles-used' });
    expect(stat).toBeDefined();
    expect(stat.props.children).toBe('12,000 mi');
  });

  it('renders miles remaining stat', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const stat = renderer!.root.findByProps({ testID: 'stats-miles-remaining' });
    expect(stat).toBeDefined();
    expect(stat.props.children).toBe('24,000 mi');
  });

  it('renders projected total stat', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const stat = renderer!.root.findByProps({ testID: 'stats-projected-total' });
    expect(stat).toBeDefined();
    expect(stat.props.children).toBe('14,000 mi');
  });

  it('renders days forward/behind stat', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const stat = renderer!.root.findByProps({ testID: 'stats-days-forward-behind' });
    expect(stat).toBeDefined();
  });

  it('renders projected overage as None when under pace', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const stat = renderer!.root.findByProps({ testID: 'stats-projected-overage' });
    expect(stat).toBeDefined();
    expect(stat.props.children).toBe('None');
  });

  it('renders projected overage with miles when over pace', async () => {
    setupQueryMocks({
      summary: { ...mockSummary, projectedMiles: 38000 },
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const stat = renderer!.root.findByProps({ testID: 'stats-projected-overage' });
    expect(stat.props.children).toBe('+2,000 mi');
  });

  it('renders cost at pace as $0.00 when no overage', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const stat = renderer!.root.findByProps({ testID: 'stats-cost-at-pace' });
    expect(stat.props.children).toBe('$0.00');
  });

  it('renders estimated cost when there is projected overage', async () => {
    setupQueryMocks({
      summary: { ...mockSummary, projectedMiles: 38000 },
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const stat = renderer!.root.findByProps({ testID: 'stats-cost-at-pace' });
    // 2000 overage * $0.25/mi = $500
    expect(stat.props.children).toBe('~$500.00');
  });

  it('renders banner ad for free tier', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const ad = renderer!.root.findByProps({ testID: 'banner-ad-view' });
    expect(ad).toBeDefined();
  });

  it('does not render banner ad for premium users', async () => {
    setupQueryMocks({
      subscription: { isPremium: true, tier: 'premium', expiresAt: null, platform: 'ios', productId: 'premium_monthly' },
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const ads = renderer!.root.findAllByProps({ testID: 'banner-ad-view' });
    expect(ads.length).toBe(0);
  });

  it('renders back button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const back = renderer!.root.findByProps({ testID: 'pace-detail-back' });
    expect(back).toBeDefined();
  });

  it('renders scroll view', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<PaceDetailScreen />);
    });
    const scroll = renderer!.root.findByProps({ testID: 'pace-detail-scroll' });
    expect(scroll).toBeDefined();
  });
});

describe('computeDaysForwardBehind', () => {
  // 2-year lease from 2025-01-01 to 2027-01-01: 365 + 365 = 730 days (no leap years)
  const baseLease: Lease = {
    id: 'lease-1',
    userId: 'user-1',
    vehicleYear: 2023,
    vehicleMake: 'Toyota',
    vehicleModel: 'Camry',
    startDate: '2025-01-01',
    endDate: '2027-01-01',
    totalMiles: 24000,
    startingMileage: 0,
    currentMileage: 0,
    monthlyMiles: 1000,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  const baseSummary: LeaseSummary = {
    leaseId: 'lease-1',
    vehicleLabel: '2023 Toyota Camry',
    startDate: '2025-01-01',
    endDate: '2027-01-01',
    totalMiles: 24000,
    milesUsed: 12000,
    milesRemaining: 12000,
    daysRemaining: 365,
    projectedMiles: 13000,
    isOverPace: false,
  };

  it('returns days and ahead=true when above expected mileage', () => {
    // 730 total days, 365 remaining → 365 elapsed
    // expected = (365/730) * 24000 = 12000
    // actual = 13000 (ahead by 1000 miles)
    const summary = { ...baseSummary, milesUsed: 13000, daysRemaining: 365 };
    const result = computeDaysForwardBehind(baseLease, summary);
    expect(result.isAhead).toBe(true);
    expect(result.days).toBeGreaterThan(0);
  });

  it('returns days and ahead=false when below expected mileage', () => {
    // 730 total days, 365 remaining → 365 elapsed
    // expected = 12000, actual = 11000 (behind by 1000 miles)
    const summary = { ...baseSummary, milesUsed: 11000, daysRemaining: 365 };
    const result = computeDaysForwardBehind(baseLease, summary);
    expect(result.isAhead).toBe(false);
    expect(result.days).toBeGreaterThan(0);
  });

  it('returns 0 days when exactly on pace', () => {
    // 730 total days, 365 remaining → 365 elapsed
    // expected = (365/730) * 24000 = 12000, actual = 12000
    const summary = { ...baseSummary, milesUsed: 12000, daysRemaining: 365 };
    const result = computeDaysForwardBehind(baseLease, summary);
    expect(result.days).toBe(0);
  });
});
