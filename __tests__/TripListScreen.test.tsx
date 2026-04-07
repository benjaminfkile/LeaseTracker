jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock('../src/api/tripsApi', () => ({
  getTrips: jest.fn(),
  updateTrip: jest.fn(),
}));

jest.mock('../src/api/leaseApi', () => ({
  getLeaseSummary: jest.fn(),
}));

jest.mock('../src/api/subscriptionApi', () => ({
  getStatus: jest.fn(),
}));

jest.mock('../src/stores/leasesStore');

jest.mock('react-native-google-mobile-ads', () => ({
  BannerAd: 'BannerAd',
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
  TestIds: { ADAPTIVE_BANNER: 'test-banner-id' },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('react-native-config', () => ({ ADMOB_BANNER_UNIT_ID: 'test-ad-unit' }));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLeasesStore } from '../src/stores/leasesStore';
import { TripListScreen } from '../src/screens/trips/TripListScreen';
import type { SavedTrip, Lease, LeaseSummary } from '../src/types/api';

const mockUseQuery = useQuery as jest.Mock;
const mockUseMutation = useMutation as jest.Mock;
const mockUseQueryClient = useQueryClient as jest.Mock;
const mockUseLeasesStore = useLeasesStore as unknown as jest.Mock;

const mockLease1: Lease = {
  id: 'lease-1',
  userId: 'user-1',
  vehicleYear: 2023,
  vehicleMake: 'Toyota',
  vehicleModel: 'Camry',
  startDate: '2023-01-01',
  endDate: '2026-01-01',
  totalMiles: 36000,
  startingMileage: 0,
  currentMileage: 12000,
  monthlyMiles: 1000,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockLease2: Lease = {
  id: 'lease-2',
  userId: 'user-1',
  vehicleYear: 2022,
  vehicleMake: 'Honda',
  vehicleModel: 'Civic',
  startDate: '2022-06-01',
  endDate: '2025-06-01',
  totalMiles: 36000,
  startingMileage: 0,
  currentMileage: 18000,
  monthlyMiles: 1000,
  createdAt: '2022-06-01T00:00:00Z',
  updatedAt: '2022-06-01T00:00:00Z',
};

const mockActiveTrip1: SavedTrip = {
  id: 'trip-1',
  leaseId: 'lease-1',
  distance: 250,
  tripDate: '2026-05-10',
  note: 'Road trip to Denver',
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
};

const mockActiveTrip2: SavedTrip = {
  id: 'trip-2',
  leaseId: 'lease-1',
  distance: 120,
  tripDate: '2026-06-15',
  note: '',
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
};

const mockCompletedTrip: SavedTrip = {
  id: 'trip-3',
  leaseId: 'lease-1',
  distance: 80,
  tripDate: '2026-03-20',
  note: 'Weekend getaway',
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
};

const mockSummary: LeaseSummary = {
  leaseId: 'lease-1',
  vehicleLabel: '2023 Toyota Camry',
  startDate: '2023-01-01',
  endDate: '2026-01-01',
  totalMiles: 36000,
  milesUsed: 12000,
  milesRemaining: 24000,
  daysRemaining: 200,
  projectedMiles: 35000,
  isOverPace: false,
};

function setupStoreMock({
  leases = [mockLease1],
  activeLeaseId = 'lease-1',
}: {
  leases?: Lease[];
  activeLeaseId?: string | null;
} = {}) {
  mockUseLeasesStore.mockImplementation((selector: (state: object) => unknown) =>
    selector({
      leases,
      activeLeaseId,
      setActiveLeaseId: jest.fn(),
    }),
  );
}

function setupQueryMocks({
  active = [mockActiveTrip1],
  completed = [] as SavedTrip[],
  isLoading = false,
  error = null,
  isPremium = false,
  summary = mockSummary as LeaseSummary | null,
}: {
  active?: SavedTrip[];
  completed?: SavedTrip[];
  isLoading?: boolean;
  error?: Error | null;
  isPremium?: boolean;
  summary?: LeaseSummary | null;
} = {}) {
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'trips') {
      return { data: { active, completed }, isLoading, error, refetch: jest.fn() };
    }
    if (queryKey[0] === 'lease-summary') {
      return { data: summary ?? undefined };
    }
    if (queryKey[0] === 'subscription-status') {
      return { data: { isPremium, tier: isPremium ? 'premium' : 'free', expiresAt: null, platform: null } };
    }
    return { data: undefined, isLoading: false, error: null, refetch: jest.fn() };
  });
  mockUseMutation.mockReturnValue({ mutate: jest.fn() });
  mockUseQueryClient.mockReturnValue({ invalidateQueries: jest.fn() });
}

describe('TripListScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setupStoreMock();
    setupQueryMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<TripListScreen />);
    });
  });

  it('renders with testID trip-list-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'trip-list-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the screen header with title Saved Trips', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'screen-header-title' });
    expect(title.props.children).toBe('Saved Trips');
  });

  it('shows a loading indicator when trips are loading', async () => {
    setupQueryMocks({ isLoading: true, active: [] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const loading = renderer!.root.findByProps({ testID: 'trip-list-loading' });
    expect(loading).toBeDefined();
  });

  it('shows an error message when trips fail to load', async () => {
    setupQueryMocks({ error: new Error('Network error'), active: [] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const errorEl = renderer!.root.findByProps({ testID: 'error-message' });
    expect(errorEl).toBeDefined();
  });

  it('shows empty state when there are no trips', async () => {
    setupQueryMocks({ active: [], completed: [] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const emptyTitle = renderer!.root.findByProps({ testID: 'empty-state-title' });
    expect(emptyTitle.props.children).toBe('No trips saved.');
  });

  it('shows empty state subtitle', async () => {
    setupQueryMocks({ active: [], completed: [] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const subtitle = renderer!.root.findByProps({ testID: 'empty-state-subtitle' });
    expect(subtitle.props.children).toBe('Plan ahead and save miles for your next trip.');
  });

  it('renders the SectionList when trips are available', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const list = renderer!.root.findByProps({ testID: 'trip-list-section-list' });
    expect(list).toBeDefined();
  });

  it('renders Active section header when active trips exist', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const section = renderer!.root.findByProps({ testID: 'trip-section-active' });
    expect(section).toBeDefined();
  });

  it('renders Completed section header when completed trips exist', async () => {
    setupQueryMocks({ active: [], completed: [mockCompletedTrip] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const section = renderer!.root.findByProps({ testID: 'trip-section-completed' });
    expect(section).toBeDefined();
  });

  it('renders a TripCard for each active trip', async () => {
    setupQueryMocks({ active: [mockActiveTrip1, mockActiveTrip2] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const card1 = renderer!.root.findByProps({ testID: 'trip-card-trip-1' });
    expect(card1).toBeDefined();
    const card2 = renderer!.root.findByProps({ testID: 'trip-card-trip-2' });
    expect(card2).toBeDefined();
  });

  it('renders the trip name from note when present', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const name = renderer!.root.findByProps({ testID: 'trip-name-trip-1' });
    expect(name.props.children).toBe('Road trip to Denver');
  });

  it('renders default Trip name when note is empty', async () => {
    setupQueryMocks({ active: [mockActiveTrip2] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const name = renderer!.root.findByProps({ testID: 'trip-name-trip-2' });
    expect(name.props.children).toBe('Trip');
  });

  it('renders the trip date', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const date = renderer!.root.findByProps({ testID: 'trip-date-trip-1' });
    expect(date).toBeDefined();
  });

  it('renders the trip distance', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const distance = renderer!.root.findByProps({ testID: 'trip-distance-trip-1' });
    expect(distance.props.children).toBe('250 mi');
  });

  it('renders the budget impact text', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const impact = renderer!.root.findByProps({ testID: 'trip-impact-trip-1' });
    expect(impact.props.children).toBe('Uses 250 of your 24,000 remaining miles');
  });

  it('renders a green checkmark for completed trips', async () => {
    setupQueryMocks({ active: [], completed: [mockCompletedTrip] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const checkmark = renderer!.root.findByProps({ testID: 'trip-checkmark-trip-3' });
    expect(checkmark).toBeDefined();
  });

  it('does not render a checkmark for active trips', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const checkmarks = renderer!.root.findAllByProps({ testID: 'trip-checkmark-trip-1' });
    expect(checkmarks).toHaveLength(0);
  });

  it('renders the FAB when trips are available', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const fab = renderer!.root.findByProps({ testID: 'trip-list-fab' });
    expect(fab).toBeDefined();
  });

  it('renders the FAB on empty state as well', async () => {
    setupQueryMocks({ active: [], completed: [] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const fab = renderer!.root.findByProps({ testID: 'trip-list-fab' });
    expect(fab).toBeDefined();
  });

  it('does not render LeaseSelectorPills when there is only one lease', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const pills = renderer!.root.findAllByProps({ testID: 'lease-selector-pills' });
    expect(pills).toHaveLength(0);
  });

  it('renders LeaseSelectorPills when there are multiple leases', async () => {
    setupStoreMock({ leases: [mockLease1, mockLease2], activeLeaseId: 'lease-1' });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const pills = renderer!.root.findByProps({ testID: 'lease-selector-pills' });
    expect(pills).toBeDefined();
  });

  it('renders BannerAdView for free tier users', async () => {
    setupQueryMocks({ isPremium: false });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const banner = renderer!.root.findByProps({ testID: 'banner-ad-view' });
    expect(banner).toBeDefined();
  });

  it('does not render BannerAdView for premium users', async () => {
    setupQueryMocks({ isPremium: true });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const banners = renderer!.root.findAllByProps({ testID: 'banner-ad-view' });
    expect(banners).toHaveLength(0);
  });

  it('renders both Active and Completed sections when both have trips', async () => {
    setupQueryMocks({ active: [mockActiveTrip1], completed: [mockCompletedTrip] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const activeSection = renderer!.root.findByProps({ testID: 'trip-section-active' });
    expect(activeSection).toBeDefined();
    const completedSection = renderer!.root.findByProps({ testID: 'trip-section-completed' });
    expect(completedSection).toBeDefined();
  });

  it('formats large distance with locale separator', async () => {
    const bigTrip: SavedTrip = {
      ...mockActiveTrip1,
      id: 'trip-big',
      distance: 1500,
    };
    setupQueryMocks({ active: [bigTrip] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const distance = renderer!.root.findByProps({ testID: 'trip-distance-trip-big' });
    expect(distance.props.children).toBe('1,500 mi');
  });

  it('renders Mark Complete button for active trips', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const button = renderer!.root.findByProps({ testID: 'trip-mark-complete-trip-1' });
    expect(button).toBeDefined();
  });

  it('does not render Mark Complete button for completed trips', async () => {
    setupQueryMocks({ active: [], completed: [mockCompletedTrip] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const buttons = renderer!.root.findAllByProps({ testID: 'trip-mark-complete-trip-3' });
    expect(buttons).toHaveLength(0);
  });

  it('renders impact text with fallback format when summary is not available', async () => {
    setupQueryMocks({ summary: null });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<TripListScreen />);
    });
    const impact = renderer!.root.findByProps({ testID: 'trip-impact-trip-1' });
    expect(impact.props.children).toBe('−250 mi from budget');
  });
});
