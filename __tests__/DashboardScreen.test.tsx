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

jest.mock('react-native-google-mobile-ads', () => ({
  BannerAd: 'BannerAd',
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
  TestIds: { ADAPTIVE_BANNER: 'ca-app-pub-3940256099942544/2435281174' },
}));

jest.mock('react-native-config', () => ({
  API_BASE_URL: 'https://api.test.com',
  AD_BANNER_UNIT_ID: undefined,
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
    reset: jest.fn(),
    getParent: jest.fn(() => ({ navigate: jest.fn() })),
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('../src/api/leaseApi', () => ({
  getLeases: jest.fn(),
  getLeaseSummary: jest.fn(),
  getLeaseMembers: jest.fn(),
}));
jest.mock('../src/api/tripsApi', () => ({
  getTrips: jest.fn(),
}));
jest.mock('../src/api/subscriptionApi', () => ({
  getStatus: jest.fn(),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useQuery } from '@tanstack/react-query';
import { DashboardScreen } from '../src/screens/home/DashboardScreen';
import type { Lease, LeaseSummary, SavedTrip, SubscriptionStatus } from '../src/types/api';

const mockUseQuery = useQuery as jest.Mock;

const mockLease: Lease = {
  id: 'lease-1',
  user_id: 'user-1',
  display_name: '',
  make: 'Toyota',
  model: 'Camry',
  year: 2023,
  trim: 'SE',
  color: null,
  vin: null,
  license_plate: null,
  lease_start_date: '2023-01-01',
  lease_end_date: '2026-01-01',
  total_miles_allowed: 36000,
  miles_per_year: 12000,
  starting_odometer: 0,
  current_odometer: 12000,
  overage_cost_per_mile: '0.25',
  monthly_payment: null,
  dealer_name: null,
  dealer_phone: null,
  contract_number: null,
  notes: null,
  is_active: true,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const mockSummary: LeaseSummary = {
  miles_driven: 12000,
  miles_remaining: 24000,
  days_elapsed: 730,
  days_remaining: 365,
  lease_length_days: 1095,
  expected_miles_to_date: 24000,
  current_pace_per_month: 1000,
  pace_status: 'ahead',
  miles_over_under_pace: -12000,
  projected_miles_at_end: 14400,
  projected_overage: 0,
  projected_overage_cost: 0,
  recommended_daily_miles: 66,
  reserved_trip_miles: 0,
  is_premium: false,
};

const mockTrip: SavedTrip = {
  id: 'trip-1',
  leaseId: 'lease-1',
  distance: 150,
  tripDate: '2024-01-10',
  createdAt: '2024-01-10T00:00:00Z',
  updatedAt: '2024-01-10T00:00:00Z',
};

const mockSubscription: SubscriptionStatus = {
  isPremium: false,
  tier: 'free',
  expiresAt: null,
  platform: null,
  productId: null,
};

function setupQueryMocks({
  leases = [mockLease],
  summary = mockSummary,
  trips = { active: [], completed: [] },
  subscription = mockSubscription,
  leasesLoading = false,
  summaryLoading = false,
  leasesError = null,
}: {
  leases?: Lease[];
  summary?: LeaseSummary | null;
  trips?: { active: SavedTrip[]; completed: SavedTrip[] };
  subscription?: SubscriptionStatus;
  leasesLoading?: boolean;
  summaryLoading?: boolean;
  leasesError?: Error | null;
} = {}) {
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    const key = queryKey[0];
    if (key === 'leases') {
      return { data: leases, isLoading: leasesLoading, error: leasesError };
    }
    if (key === 'lease-summary') {
      return { data: summary, isLoading: summaryLoading };
    }
    if (key === 'trips') {
      return { data: trips };
    }
    if (key === 'subscription-status') {
      return { data: subscription };
    }
    return { data: undefined, isLoading: false };
  });
}

describe('DashboardScreen', () => {
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
      ReactTestRenderer.create(<DashboardScreen />);
    });
  });

  it('renders with testID dashboard-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'dashboard-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Dashboard title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'dashboard-title' });
    expect(title).toBeDefined();
  });

  it('shows a loading indicator when leases are loading', async () => {
    setupQueryMocks({ leasesLoading: true, leases: [] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const loading = renderer!.root.findByProps({ testID: 'dashboard-loading' });
    expect(loading).toBeDefined();
  });

  it('shows an error message when leases fail to load', async () => {
    setupQueryMocks({ leasesError: new Error('Network error'), leases: [] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const errorEl = renderer!.root.findByProps({ testID: 'error-message' });
    expect(errorEl).toBeDefined();
  });

  it('shows empty state when there are no leases', async () => {
    setupQueryMocks({ leases: [] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'dashboard-title' });
    expect(title.props.children).toBe('No Active Leases');
  });

  it('renders the stats row when lease data is available', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const statsRow = renderer!.root.findByProps({ testID: 'dashboard-stats-row' });
    expect(statsRow).toBeDefined();
  });

  it('renders miles remaining stat', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const statEl = renderer!.root.findByProps({ testID: 'stat-miles-remaining' });
    expect(statEl).toBeDefined();
  });

  it('renders days left stat', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const statEl = renderer!.root.findByProps({ testID: 'stat-days-left' });
    expect(statEl).toBeDefined();
  });

  it('renders monthly miles stat', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const statEl = renderer!.root.findByProps({ testID: 'stat-monthly-miles' });
    expect(statEl).toBeDefined();
  });

  it('renders the pace status badge', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const badge = renderer!.root.findByProps({ testID: 'pace-status-badge' });
    expect(badge).toBeDefined();
  });

  it('renders Ahead badge when ahead of pace', async () => {
    setupQueryMocks({ summary: { ...mockSummary, pace_status: 'ahead' } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const label = renderer!.root.findByProps({ testID: 'pace-status-badge-label' });
    expect(label.props.children).toBe('Ahead');
  });

  it('renders On Track badge when on track', async () => {
    setupQueryMocks({ summary: { ...mockSummary, pace_status: 'on_track' } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const label = renderer!.root.findByProps({ testID: 'pace-status-badge-label' });
    expect(label.props.children).toBe('On Track');
  });

  it('renders Behind badge when behind pace', async () => {
    setupQueryMocks({ summary: { ...mockSummary, pace_status: 'behind' } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const label = renderer!.root.findByProps({ testID: 'pace-status-badge-label' });
    expect(label.props.children).toBe('Behind');
  });

  it('renders the pace callout when daysRemaining > 0', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const callout = renderer!.root.findByProps({ testID: 'dashboard-pace-callout' });
    expect(callout).toBeDefined();
  });

  it('renders the quick actions row', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const actions = renderer!.root.findByProps({ testID: 'dashboard-quick-actions' });
    expect(actions).toBeDefined();
  });

  it('renders the Log Odometer quick action button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const btn = renderer!.root.findByProps({ testID: 'action-log-odometer' });
    expect(btn).toBeDefined();
  });

  it('renders the View Full Stats quick action button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const btn = renderer!.root.findByProps({ testID: 'action-view-stats' });
    expect(btn).toBeDefined();
  });

  it('renders the Trips quick action button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const btn = renderer!.root.findByProps({ testID: 'action-trips' });
    expect(btn).toBeDefined();
  });

  it('renders the banner ad for free-tier users', async () => {
    setupQueryMocks({ subscription: { ...mockSubscription, isPremium: false } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const ad = renderer!.root.findByProps({ testID: 'banner-ad-view' });
    expect(ad).toBeDefined();
  });

  it('does not render the banner ad for premium users', async () => {
    setupQueryMocks({
      subscription: { ...mockSubscription, isPremium: true, tier: 'premium' },
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const ads = renderer!.root.findAllByProps({ testID: 'banner-ad-view' });
    expect(ads).toHaveLength(0);
  });

  it('does not render lease selector when only one lease', async () => {
    setupQueryMocks({ leases: [mockLease] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const pills = renderer!.root.findAllByProps({ testID: 'lease-selector-pills' });
    expect(pills).toHaveLength(0);
  });

  it('renders lease selector when 2 or more leases', async () => {
    const secondLease: Lease = {
      ...mockLease,
      id: 'lease-2',
      make: 'Honda',
      model: 'Civic',
    };
    setupQueryMocks({ leases: [mockLease, secondLease] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const pills = renderer!.root.findByProps({ testID: 'lease-selector-pills' });
    expect(pills).toBeDefined();
  });

  it('does not render the reserved row when there are no active trips', async () => {
    setupQueryMocks({ trips: { active: [], completed: [] } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const reserved = renderer!.root.findAllByProps({ testID: 'dashboard-reserved-row' });
    expect(reserved).toHaveLength(0);
  });

  it('renders the reserved row when active trips exist', async () => {
    setupQueryMocks({ trips: { active: [mockTrip], completed: [] } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const reserved = renderer!.root.findByProps({ testID: 'dashboard-reserved-row' });
    expect(reserved).toBeDefined();
  });

  it('displays the correct reserved miles total', async () => {
    const trip2: SavedTrip = { ...mockTrip, id: 'trip-2', distance: 100 };
    setupQueryMocks({ trips: { active: [mockTrip, trip2], completed: [] } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const value = renderer!.root.findByProps({ testID: 'dashboard-reserved-value' });
    expect(value.props.children).toBe('250 mi');
  });

  it('renders the QuickAddFAB when lease data is available', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const fab = renderer!.root.findByProps({ testID: 'quick-add-fab' });
    expect(fab).toBeDefined();
  });

  it('does not render the QuickAddFAB in the empty state', async () => {
    setupQueryMocks({ leases: [] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const fabs = renderer!.root.findAllByProps({ testID: 'quick-add-fab' });
    expect(fabs).toHaveLength(0);
  });

  it('does not render the QuickAddFAB in the loading state', async () => {
    setupQueryMocks({ leasesLoading: true, leases: [] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const fabs = renderer!.root.findAllByProps({ testID: 'quick-add-fab' });
    expect(fabs).toHaveLength(0);
  });

  it('does not render the QuickAddFAB in the error state', async () => {
    setupQueryMocks({ leasesError: new Error('Network error'), leases: [] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const fabs = renderer!.root.findAllByProps({ testID: 'quick-add-fab' });
    expect(fabs).toHaveLength(0);
  });

  it('renders the Full Lease / This Year toggle when lease data is available', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'dashboard-toggle' });
    expect(toggle).toBeDefined();
  });

  it('renders the Full Lease toggle button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const btn = renderer!.root.findByProps({ testID: 'dashboard-toggle-full-lease' });
    expect(btn).toBeDefined();
  });

  it('renders the This Year toggle button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const btn = renderer!.root.findByProps({ testID: 'dashboard-toggle-this-year' });
    expect(btn).toBeDefined();
  });

  it('does not render the toggle when there is no lease summary', async () => {
    setupQueryMocks({ summary: null });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const toggles = renderer!.root.findAllByProps({ testID: 'dashboard-toggle' });
    expect(toggles).toHaveLength(0);
  });

  it('switches to This Year mode when the This Year button is pressed', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const thisYearBtn = renderer!.root.findByProps({ testID: 'dashboard-toggle-this-year' });
    await ReactTestRenderer.act(() => {
      thisYearBtn.props.onPress();
    });
    // Stats row should still render after toggling
    const statsRow = renderer!.root.findByProps({ testID: 'dashboard-stats-row' });
    expect(statsRow).toBeDefined();
  });

  it('switches back to Full Lease mode when the Full Lease button is pressed', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<DashboardScreen />);
    });
    const thisYearBtn = renderer!.root.findByProps({ testID: 'dashboard-toggle-this-year' });
    await ReactTestRenderer.act(() => {
      thisYearBtn.props.onPress();
    });
    const fullLeaseBtn = renderer!.root.findByProps({ testID: 'dashboard-toggle-full-lease' });
    await ReactTestRenderer.act(() => {
      fullLeaseBtn.props.onPress();
    });
    // After switching back, miles remaining should match the full-lease summary
    const remaining = renderer!.root.findByProps({ testID: 'stat-miles-remaining' });
    expect(remaining).toBeDefined();
  });
});
