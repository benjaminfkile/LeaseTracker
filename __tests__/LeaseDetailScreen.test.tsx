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
    getParent: jest.fn(() => ({ navigate: jest.fn() })),
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
  getLeaseMembers: jest.fn(),
}));
jest.mock('../src/api/readingsApi', () => ({
  getReadings: jest.fn(),
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
import { LeaseDetailScreen } from '../src/screens/home/LeaseDetailScreen';
import type {
  Lease,
  LeaseSummary,
  OdometerReading,
  SavedTrip,
  LeaseMember,
  SubscriptionStatus,
} from '../src/types/api';

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
  projectedMiles: 14400,
  isOverPace: false,
};

const mockReading: OdometerReading = {
  id: 'reading-1',
  leaseId: 'lease-1',
  mileage: 12500,
  readingDate: '2024-02-01',
  createdAt: '2024-02-01T00:00:00Z',
};

const mockTrip: SavedTrip = {
  id: 'trip-1',
  leaseId: 'lease-1',
  distance: 150,
  tripDate: '2024-01-10',
  createdAt: '2024-01-10T00:00:00Z',
  updatedAt: '2024-01-10T00:00:00Z',
};

const mockMember: LeaseMember = {
  id: 'member-1',
  leaseId: 'lease-1',
  userId: 'user-2',
  email: 'jane@example.com',
  role: 'viewer',
  createdAt: '2024-01-01T00:00:00Z',
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
  readings = [mockReading],
  trips = { active: [mockTrip], completed: [] },
  members = [] as LeaseMember[],
  subscription = mockSubscription,
  leaseLoading = false,
  summaryLoading = false,
  leaseError = null,
}: {
  lease?: Lease | null;
  summary?: LeaseSummary | null;
  readings?: OdometerReading[];
  trips?: { active: SavedTrip[]; completed: SavedTrip[] };
  members?: LeaseMember[];
  subscription?: SubscriptionStatus;
  leaseLoading?: boolean;
  summaryLoading?: boolean;
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
    if (key === 'readings') {
      return { data: readings };
    }
    if (key === 'trips') {
      return { data: trips };
    }
    if (key === 'lease-members') {
      return { data: members };
    }
    if (key === 'subscription-status') {
      return { data: subscription };
    }
    return { data: undefined, isLoading: false };
  });
}

describe('LeaseDetailScreen', () => {
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
      ReactTestRenderer.create(<LeaseDetailScreen />);
    });
  });

  it('renders with testID lease-detail-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'lease-detail-screen' });
    expect(screen).toBeDefined();
  });

  it('shows a loading indicator when lease is loading', async () => {
    setupQueryMocks({ leaseLoading: true, lease: null });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const loading = renderer!.root.findByProps({ testID: 'lease-detail-loading' });
    expect(loading).toBeDefined();
  });

  it('shows an error message when lease fails to load', async () => {
    setupQueryMocks({ leaseError: new Error('Network error'), lease: null });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const errorEl = renderer!.root.findByProps({ testID: 'error-message' });
    expect(errorEl).toBeDefined();
  });

  it('renders the stats row when lease data is available', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const statsRow = renderer!.root.findByProps({ testID: 'lease-detail-stats-row' });
    expect(statsRow).toBeDefined();
  });

  it('renders miles remaining stat', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const statEl = renderer!.root.findByProps({ testID: 'stat-miles-remaining' });
    expect(statEl).toBeDefined();
  });

  it('renders days left stat', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const statEl = renderer!.root.findByProps({ testID: 'stat-days-left' });
    expect(statEl).toBeDefined();
  });

  it('renders monthly miles stat', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const statEl = renderer!.root.findByProps({ testID: 'stat-monthly-miles' });
    expect(statEl).toBeDefined();
  });

  it('renders the pace status badge', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const badge = renderer!.root.findByProps({ testID: 'pace-status-badge' });
    expect(badge).toBeDefined();
  });

  it('renders On Track badge when not over pace', async () => {
    setupQueryMocks({ summary: { ...mockSummary, isOverPace: false } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const label = renderer!.root.findByProps({ testID: 'pace-status-badge-label' });
    expect(label.props.children).toBe('On Track');
  });

  it('renders Slightly Over badge when slightly over pace', async () => {
    setupQueryMocks({
      summary: {
        ...mockSummary,
        isOverPace: true,
        projectedMiles: 38000,
        totalMiles: 36000,
      },
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const label = renderer!.root.findByProps({ testID: 'pace-status-badge-label' });
    expect(label.props.children).toBe('Slightly Over');
  });

  it('renders Over Pace badge when significantly over pace', async () => {
    setupQueryMocks({
      summary: {
        ...mockSummary,
        isOverPace: true,
        projectedMiles: 42000,
        totalMiles: 36000,
      },
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const label = renderer!.root.findByProps({ testID: 'pace-status-badge-label' });
    expect(label.props.children).toBe('Over Pace');
  });

  it('renders the pace callout when daysRemaining > 0', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const callout = renderer!.root.findByProps({ testID: 'lease-detail-pace-callout' });
    expect(callout).toBeDefined();
  });

  it('does not render the pace callout when daysRemaining is 0', async () => {
    setupQueryMocks({ summary: { ...mockSummary, daysRemaining: 0 } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const callouts = renderer!.root.findAllByProps({ testID: 'lease-detail-pace-callout' });
    expect(callouts).toHaveLength(0);
  });

  it('renders the odometer log row', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const row = renderer!.root.findByProps({ testID: 'odometer-log-row' });
    expect(row).toBeDefined();
  });

  it('renders the latest odometer reading when available', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const reading = renderer!.root.findByProps({ testID: 'odometer-latest-reading' });
    expect(reading.props.children).toBe('12,500 mi');
  });

  it('does not render the latest reading when no readings exist', async () => {
    setupQueryMocks({ readings: [] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const readings = renderer!.root.findAllByProps({ testID: 'odometer-latest-reading' });
    expect(readings).toHaveLength(0);
  });

  it('renders the View All link on the odometer log row', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const viewAll = renderer!.root.findByProps({ testID: 'odometer-view-all' });
    expect(viewAll).toBeDefined();
  });

  it('renders the saved trips row', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const row = renderer!.root.findByProps({ testID: 'saved-trips-row' });
    expect(row).toBeDefined();
  });

  it('displays the correct trip count', async () => {
    setupQueryMocks({
      trips: { active: [mockTrip], completed: [{ ...mockTrip, id: 'trip-2' }] },
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const count = renderer!.root.findByProps({ testID: 'saved-trips-count' });
    expect(count.props.children).toBe('2 trips');
  });

  it('displays singular "trip" for a single trip', async () => {
    setupQueryMocks({ trips: { active: [mockTrip], completed: [] } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const count = renderer!.root.findByProps({ testID: 'saved-trips-count' });
    expect(count.props.children).toBe('1 trip');
  });

  it('renders the shared-with row', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const row = renderer!.root.findByProps({ testID: 'shared-with-row' });
    expect(row).toBeDefined();
  });

  it('shows the premium lock for sharing when not premium', async () => {
    setupQueryMocks({ subscription: { ...mockSubscription, isPremium: false } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const locked = renderer!.root.findByProps({ testID: 'shared-with-locked' });
    expect(locked).toBeDefined();
  });

  it('shows "Only you" when there are no shared members and user is premium', async () => {
    setupQueryMocks({
      members: [],
      subscription: { ...mockSubscription, isPremium: true, tier: 'premium' },
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const onlyYou = renderer!.root.findByProps({ testID: 'shared-with-only-you' });
    expect(onlyYou).toBeDefined();
  });

  it('renders member avatars when members are present and user is premium', async () => {
    setupQueryMocks({
      members: [mockMember],
      subscription: { ...mockSubscription, isPremium: true, tier: 'premium' },
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const avatars = renderer!.root.findByProps({ testID: 'shared-with-avatars' });
    expect(avatars).toBeDefined();
    const avatar = renderer!.root.findByProps({ testID: 'member-avatar-member-1' });
    expect(avatar).toBeDefined();
  });

  it('shows overflow indicator when more than 3 members and user is premium', async () => {
    const extraMembers: LeaseMember[] = [
      { ...mockMember, id: 'm1', email: 'a@x.com' },
      { ...mockMember, id: 'm2', email: 'b@x.com' },
      { ...mockMember, id: 'm3', email: 'c@x.com' },
      { ...mockMember, id: 'm4', email: 'd@x.com' },
    ];
    setupQueryMocks({
      members: extraMembers,
      subscription: { ...mockSubscription, isPremium: true, tier: 'premium' },
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const overflow = renderer!.root.findByProps({ testID: 'member-avatar-overflow' });
    expect(overflow).toBeDefined();
  });

  it('renders the lease info panel', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const panel = renderer!.root.findByProps({ testID: 'lease-info-panel' });
    expect(panel).toBeDefined();
  });

  it('lease info body is hidden by default', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const body = renderer!.root.findAllByProps({ testID: 'lease-info-body' });
    expect(body).toHaveLength(0);
  });

  it('shows lease info body after tapping the toggle', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'lease-info-toggle' });
    await ReactTestRenderer.act(() => {
      toggle.props.onPress();
    });
    const body = renderer!.root.findByProps({ testID: 'lease-info-body' });
    expect(body).toBeDefined();
  });

  it('renders lease info rows when panel is expanded', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'lease-info-toggle' });
    await ReactTestRenderer.act(() => {
      toggle.props.onPress();
    });
    const vehicle = renderer!.root.findByProps({ testID: 'lease-info-vehicle' });
    expect(vehicle).toBeDefined();
    const startDate = renderer!.root.findByProps({ testID: 'lease-info-start-date' });
    expect(startDate).toBeDefined();
    const endDate = renderer!.root.findByProps({ testID: 'lease-info-end-date' });
    expect(endDate).toBeDefined();
    const totalMiles = renderer!.root.findByProps({ testID: 'lease-info-total-miles' });
    expect(totalMiles).toBeDefined();
    const startingOdo = renderer!.root.findByProps({
      testID: 'lease-info-starting-odometer',
    });
    expect(startingOdo).toBeDefined();
  });

  it('renders the End of Lease Tools section', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const section = renderer!.root.findByProps({ testID: 'end-of-lease-section' });
    expect(section).toBeDefined();
  });

  it('renders the Buyback Analysis row', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const row = renderer!.root.findByProps({ testID: 'buyback-analysis-row' });
    expect(row).toBeDefined();
  });

  it('renders the Turn-In Checklist row', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const row = renderer!.root.findByProps({ testID: 'turn-in-checklist-row' });
    expect(row).toBeDefined();
  });

  it('renders the banner ad for free-tier users', async () => {
    setupQueryMocks({ subscription: { ...mockSubscription, isPremium: false } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
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
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const ads = renderer!.root.findAllByProps({ testID: 'banner-ad-view' });
    expect(ads).toHaveLength(0);
  });

  it('renders the mileage ring container when summary is available', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const ring = renderer!.root.findByProps({ testID: 'lease-detail-ring-container' });
    expect(ring).toBeDefined();
  });

  it('does not render the mileage ring when summary is null', async () => {
    setupQueryMocks({ summary: null });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseDetailScreen />);
    });
    const rings = renderer!.root.findAllByProps({ testID: 'lease-detail-ring-container' });
    expect(rings).toHaveLength(0);
  });
});
