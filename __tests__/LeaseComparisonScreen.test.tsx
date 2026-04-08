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
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

jest.mock('../src/api/leaseApi', () => ({
  getLeases: jest.fn(),
  getLeaseSummary: jest.fn(),
}));

jest.mock('../src/api/subscriptionApi', () => ({
  getStatus: jest.fn(),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useQuery } from '@tanstack/react-query';
import {
  LeaseComparisonScreen,
  computePaceStatus,
} from '../src/screens/home/LeaseComparisonScreen';
import type { Lease, LeaseSummary, SubscriptionStatus } from '../src/types/api';

const mockUseQuery = useQuery as jest.Mock;

const mockLease1: Lease = {
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
  currentMileage: 15000,
  monthlyMiles: 1000,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockLease2: Lease = {
  id: 'lease-2',
  userId: 'user-1',
  vehicleYear: 2024,
  vehicleMake: 'Honda',
  vehicleModel: 'Civic',
  startDate: '2024-01-01',
  endDate: '2027-01-01',
  totalMiles: 45000,
  startingMileage: 0,
  currentMileage: 8000,
  monthlyMiles: 1250,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockSummary1: LeaseSummary = {
  leaseId: 'lease-1',
  vehicleLabel: '2023 Toyota Camry SE',
  startDate: '2023-01-01',
  endDate: '2026-01-01',
  totalMiles: 36000,
  milesUsed: 15000,
  milesRemaining: 21000,
  daysRemaining: 365,
  projectedMiles: 38000,
  isOverPace: true,
};

const mockSummary2: LeaseSummary = {
  leaseId: 'lease-2',
  vehicleLabel: '2024 Honda Civic',
  startDate: '2024-01-01',
  endDate: '2027-01-01',
  totalMiles: 45000,
  milesUsed: 8000,
  milesRemaining: 37000,
  daysRemaining: 730,
  projectedMiles: 40000,
  isOverPace: false,
};

const mockSubscriptionFree: SubscriptionStatus = {
  isPremium: false,
  tier: 'free',
  expiresAt: null,
  platform: null,
  productId: null,
};

const mockSubscriptionPremium: SubscriptionStatus = {
  isPremium: true,
  tier: 'premium',
  expiresAt: null,
  platform: 'ios',
  productId: 'premium_monthly',
};

function setupQueryMocks({
  leases = [mockLease1, mockLease2],
  summaries = [mockSummary1, mockSummary2],
  subscription = mockSubscriptionPremium,
  leasesLoading = false,
  leasesError = null,
}: {
  leases?: Lease[] | null;
  summaries?: (LeaseSummary | null)[];
  subscription?: SubscriptionStatus;
  leasesLoading?: boolean;
  leasesError?: Error | null;
} = {}) {
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    const key = queryKey[0];
    if (key === 'leases') {
      return { data: leases, isLoading: leasesLoading, error: leasesError };
    }
    if (key === 'subscription-status') {
      return { data: subscription };
    }
    if (key === 'lease-summary') {
      const leaseId = queryKey[1];
      const index = (leases ?? []).findIndex(l => l.id === leaseId);
      return { data: index >= 0 ? summaries[index] : undefined, isLoading: false };
    }
    return { data: undefined, isLoading: false };
  });
}

describe('LeaseComparisonScreen', () => {
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
      ReactTestRenderer.create(<LeaseComparisonScreen />);
    });
  });

  it('renders with testID lease-comparison-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'lease-comparison-screen' });
    expect(screen).toBeDefined();
  });

  it('shows loading indicator when leases are loading', async () => {
    setupQueryMocks({ leasesLoading: true });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
    });
    const loading = renderer!.root.findByProps({ testID: 'lease-comparison-loading' });
    expect(loading).toBeDefined();
  });

  it('shows empty message when fewer than 2 leases', async () => {
    setupQueryMocks({ leases: [mockLease1] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
    });
    const empty = renderer!.root.findByProps({ testID: 'lease-comparison-empty' });
    expect(empty).toBeDefined();
  });

  it('shows empty message when leases is null', async () => {
    setupQueryMocks({ leases: null });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
    });
    const empty = renderer!.root.findByProps({ testID: 'lease-comparison-empty' });
    expect(empty).toBeDefined();
  });

  it('shows empty message when there is a leases error', async () => {
    setupQueryMocks({ leasesError: new Error('Network error') });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
    });
    const empty = renderer!.root.findByProps({ testID: 'lease-comparison-empty' });
    expect(empty).toBeDefined();
  });

  describe('premium gate (free tier)', () => {
    beforeEach(() => {
      setupQueryMocks({ subscription: mockSubscriptionFree });
    });

    it('renders the premium lock overlay for free users', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
      });
      const locked = renderer!.root.findByProps({ testID: 'premium-gate-locked' });
      expect(locked).toBeDefined();
    });

    it('renders the premium gate title', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
      });
      const title = renderer!.root.findByProps({ testID: 'premium-gate-title' });
      expect(title).toBeDefined();
      expect(title.props.children).toBe('Premium Feature');
    });

    it('renders the upgrade button for free users', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
      });
      const btn = renderer!.root.findByProps({ testID: 'premium-gate-upgrade-button' });
      expect(btn).toBeDefined();
    });

    it('does not render comparison content for free users', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
      });
      const titles = renderer!.root.findAllByProps({ testID: 'lease-comparison-title' });
      expect(titles.length).toBe(0);
    });
  });

  describe('premium users — comparison UI', () => {
    it('renders the Lease Comparison title', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
      });
      const title = renderer!.root.findByProps({ testID: 'lease-comparison-title' });
      expect(title).toBeDefined();
      expect(title.props.children).toBe('Lease Comparison');
    });

    it('renders subtitle', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
      });
      const subtitle = renderer!.root.findByProps({ testID: 'lease-comparison-subtitle' });
      expect(subtitle).toBeDefined();
    });

    it('renders scroll view', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
      });
      const scroll = renderer!.root.findByProps({ testID: 'lease-comparison-scroll' });
      expect(scroll).toBeDefined();
    });

    it('renders comparison cards for each lease', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
      });
      const card1 = renderer!.root.findByProps({ testID: 'comparison-card-lease-1' });
      const card2 = renderer!.root.findByProps({ testID: 'comparison-card-lease-2' });
      expect(card1).toBeDefined();
      expect(card2).toBeDefined();
    });

    it('renders vehicle labels on cards', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
      });
      const label1 = renderer!.root.findByProps({ testID: 'comparison-card-label-lease-1' });
      const label2 = renderer!.root.findByProps({ testID: 'comparison-card-label-lease-2' });
      expect(label1.props.children).toBe('2023 Toyota Camry SE');
      expect(label2.props.children).toBe('2024 Honda Civic');
    });

    it('renders miles remaining on cards', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
      });
      const miles1 = renderer!.root.findByProps({ testID: 'comparison-card-miles-lease-1' });
      const miles2 = renderer!.root.findByProps({ testID: 'comparison-card-miles-lease-2' });
      expect(miles1.props.children).toBe('21,000');
      expect(miles2.props.children).toBe('37,000');
    });

    it('renders days remaining on cards', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
      });
      const days1 = renderer!.root.findByProps({ testID: 'comparison-card-days-lease-1' });
      const days2 = renderer!.root.findByProps({ testID: 'comparison-card-days-lease-2' });
      expect(days1.props.children).toBe('365');
      expect(days2.props.children).toBe('730');
    });

    it('renders pace badges on cards', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
      });
      const pace1 = renderer!.root.findByProps({ testID: 'comparison-card-pace-lease-1' });
      const pace2 = renderer!.root.findByProps({ testID: 'comparison-card-pace-lease-2' });
      expect(pace1).toBeDefined();
      expect(pace2).toBeDefined();
    });

    it('renders progress bars on cards', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
      });
      const progress1 = renderer!.root.findByProps({ testID: 'comparison-card-progress-lease-1' });
      const progress2 = renderer!.root.findByProps({ testID: 'comparison-card-progress-lease-2' });
      expect(progress1).toBeDefined();
      expect(progress2).toBeDefined();
    });

    it('renders the summary table', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
      });
      const table = renderer!.root.findByProps({ testID: 'lease-comparison-table' });
      expect(table).toBeDefined();
    });

    it('renders table title', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
      });
      const title = renderer!.root.findByProps({ testID: 'lease-comparison-table-title' });
      expect(title).toBeDefined();
      expect(title.props.children).toBe('Quick Summary');
    });

    it('renders miles remaining row in table', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
      });
      const row = renderer!.root.findByProps({ testID: 'lease-comparison-row-miles' });
      expect(row).toBeDefined();
    });

    it('renders days remaining row in table', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
      });
      const row = renderer!.root.findByProps({ testID: 'lease-comparison-row-days' });
      expect(row).toBeDefined();
    });

    it('renders pace row in table', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
      });
      const row = renderer!.root.findByProps({ testID: 'lease-comparison-row-pace' });
      expect(row).toBeDefined();
    });

    it('renders daily miles row in table', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
      });
      const row = renderer!.root.findByProps({ testID: 'lease-comparison-row-daily' });
      expect(row).toBeDefined();
    });

    it('renders horizontal cards row', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
      });
      const row = renderer!.root.findByProps({ testID: 'lease-comparison-cards-row' });
      expect(row).toBeDefined();
    });

    it('does not render premium gate locked for premium users', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseComparisonScreen />);
      });
      const locks = renderer!.root.findAllByProps({ testID: 'premium-gate-locked' });
      expect(locks.length).toBe(0);
    });
  });
});

describe('computePaceStatus', () => {
  it('returns on-track when not over pace', () => {
    const result = computePaceStatus({
      ...mockSummary2,
      isOverPace: false,
    });
    expect(result).toBe('on-track');
  });

  it('returns slightly-over when over pace but within 10%', () => {
    const result = computePaceStatus({
      ...mockSummary1,
      isOverPace: true,
      projectedMiles: 39000,
      totalMiles: 36000,
    });
    expect(result).toBe('slightly-over');
  });

  it('returns over-pace when projected exceeds 110% of total', () => {
    const result = computePaceStatus({
      ...mockSummary1,
      isOverPace: true,
      projectedMiles: 40000,
      totalMiles: 36000,
    });
    expect(result).toBe('over-pace');
  });

  it('returns slightly-over when totalMiles is 0 and over pace', () => {
    const result = computePaceStatus({
      ...mockSummary1,
      isOverPace: true,
      totalMiles: 0,
    });
    expect(result).toBe('slightly-over');
  });
});
