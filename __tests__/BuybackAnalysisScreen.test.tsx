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
}));

jest.mock('../src/api/subscriptionApi', () => ({
  getStatus: jest.fn(),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useQuery } from '@tanstack/react-query';
import {
  BuybackAnalysisScreen,
  computeBuybackAnalysis,
} from '../src/screens/home/BuybackAnalysisScreen';
import type { Lease, LeaseSummary, SubscriptionStatus } from '../src/types/api';

const mockUseQuery = useQuery as jest.Mock;

const mockLease: Lease = {
  id: 'lease-1',
  user_id: 'user-1',
  display_name: '2023 Toyota Camry SE',
  year: 2023,
  make: 'Toyota',
  model: 'Camry',
  trim: 'SE',
  color: null,
  vin: null,
  license_plate: null,
  lease_start_date: '2023-01-01',
  lease_end_date: '2026-01-01',
  total_miles_allowed: 36000,
  miles_per_year: 12000,
  starting_odometer: 0,
  current_odometer: 15000,
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

const mockSummaryOverPace: LeaseSummary = {
  miles_driven: 15000,
  miles_remaining: 21000,
  days_elapsed: 730,
  days_remaining: 365,
  lease_length_days: 1095,
  expected_miles_to_date: 24000,
  current_pace_per_month: 1000,
  pace_status: 'ahead',
  miles_over_under_pace: 2000,
  projected_miles_at_end: 38000,
  projected_overage: 2000,
  projected_overage_cost: 500,
  recommended_daily_miles: 58,
  reserved_trip_miles: 0,
  is_premium: false,
};

const mockSummaryOnPace: LeaseSummary = {
  ...mockSummaryOverPace,
  projected_miles_at_end: 34000,
  pace_status: 'on_track',
  projected_overage: 0,
  projected_overage_cost: 0,
  miles_over_under_pace: 0,
};

const mockSubscriptionFree: SubscriptionStatus = {
  is_active: false,
  expires_at: null,
  platform: null,
  product_id: null,
};

const mockSubscriptionPremium: SubscriptionStatus = {
  is_active: true,
  expires_at: null,
  platform: 'ios',
  product_id: 'premium_monthly',
};

function setupQueryMocks({
  lease = mockLease,
  summary = mockSummaryOverPace,
  subscription = mockSubscriptionPremium,
  leaseLoading = false,
  summaryLoading = false,
  leaseError = null,
}: {
  lease?: Lease | null;
  summary?: LeaseSummary | null;
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
    if (key === 'subscription-status') {
      return { data: subscription };
    }
    return { data: undefined, isLoading: false };
  });
}

describe('BuybackAnalysisScreen', () => {
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
      ReactTestRenderer.create(<BuybackAnalysisScreen />);
    });
  });

  it('renders with testID buyback-analysis-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'buyback-analysis-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Buyback Analysis title for premium users', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'buyback-analysis-title' });
    expect(title).toBeDefined();
    expect(title.props.children).toBe('Buyback Analysis');
  });

  it('shows loading indicator when lease data is loading', async () => {
    setupQueryMocks({ leaseLoading: true });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
    });
    const loading = renderer!.root.findByProps({ testID: 'buyback-analysis-loading' });
    expect(loading).toBeDefined();
  });

  it('shows loading indicator when summary data is loading', async () => {
    setupQueryMocks({ summaryLoading: true });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
    });
    const loading = renderer!.root.findByProps({ testID: 'buyback-analysis-loading' });
    expect(loading).toBeDefined();
  });

  it('shows error message when lease fails to load', async () => {
    setupQueryMocks({ leaseError: new Error('Network error') });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'buyback-analysis-screen' });
    expect(screen).toBeDefined();
    const titles = renderer!.root.findAllByProps({ testID: 'buyback-analysis-title' });
    expect(titles.length).toBe(0);
  });

  describe('premium gate (free tier)', () => {
    beforeEach(() => {
      setupQueryMocks({ subscription: mockSubscriptionFree });
    });

    it('renders the premium lock overlay for free users', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const locked = renderer!.root.findByProps({ testID: 'premium-gate-locked' });
      expect(locked).toBeDefined();
    });

    it('renders the premium gate title', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const title = renderer!.root.findByProps({ testID: 'premium-gate-title' });
      expect(title).toBeDefined();
      expect(title.props.children).toBe('Premium Feature');
    });

    it('renders the upgrade button for free users', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const btn = renderer!.root.findByProps({ testID: 'premium-gate-upgrade-button' });
      expect(btn).toBeDefined();
    });

    it('does not render the analysis content for free users', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const titles = renderer!.root.findAllByProps({ testID: 'buyback-analysis-title' });
      expect(titles.length).toBe(0);
    });
  });

  describe('premium users — full analysis UI', () => {
    it('renders back button', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const back = renderer!.root.findByProps({ testID: 'buyback-analysis-back' });
      expect(back).toBeDefined();
    });

    it('renders scroll view', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const scroll = renderer!.root.findByProps({ testID: 'buyback-analysis-scroll' });
      expect(scroll).toBeDefined();
    });

    it('renders vehicle label section', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const label = renderer!.root.findByProps({ testID: 'buyback-vehicle-label' });
      expect(label).toBeDefined();
    });

    it('renders rate input section', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const section = renderer!.root.findByProps({ testID: 'buyback-rate-section' });
      expect(section).toBeDefined();
    });

    it('renders rate input field', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const input = renderer!.root.findByProps({ testID: 'buyback-rate-input' });
      expect(input).toBeDefined();
    });

    it('renders cost comparison section', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const section = renderer!.root.findByProps({ testID: 'buyback-comparison-section' });
      expect(section).toBeDefined();
    });

    it('shows comparison row when overage is projected', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const row = renderer!.root.findByProps({ testID: 'buyback-comparison-row' });
      expect(row).toBeDefined();
    });

    it('shows buy-now card', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const card = renderer!.root.findByProps({ testID: 'buyback-buy-now-card' });
      expect(card).toBeDefined();
    });

    it('shows turn-in card', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const card = renderer!.root.findByProps({ testID: 'buyback-turn-in-card' });
      expect(card).toBeDefined();
    });

    it('shows on-pace message when no overage is expected', async () => {
      setupQueryMocks({ summary: mockSummaryOnPace });
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const msg = renderer!.root.findByProps({ testID: 'buyback-on-pace-message' });
      expect(msg).toBeDefined();
    });

    it('does not show comparison row when no overage', async () => {
      setupQueryMocks({ summary: mockSummaryOnPace });
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const rows = renderer!.root.findAllByProps({ testID: 'buyback-comparison-row' });
      expect(rows.length).toBe(0);
    });

    it('shows turn-in cost based on default $0.25/mi rate when overage exists', async () => {
      // projectedMiles=38000, totalMiles=36000 → overage=2000 mi
      // turnInCost = 2000 * $0.25 = $500.00
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const cost = renderer!.root.findByProps({ testID: 'buyback-turn-in-cost' });
      expect(cost.props.children).toBe('$500.00');
    });

    it('shows savings section when rate is entered and overage exists', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const input = renderer!.root.findByProps({ testID: 'buyback-rate-input' });
      await ReactTestRenderer.act(() => {
        input.props.onChangeText('0.15');
      });
      const section = renderer!.root.findByProps({ testID: 'buyback-savings-section' });
      expect(section).toBeDefined();
    });

    it('does not show savings section when no rate is entered', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const sections = renderer!.root.findAllByProps({ testID: 'buyback-savings-section' });
      expect(sections.length).toBe(0);
    });

    it('shows buy-now recommended badge when buyback rate is lower', async () => {
      // overage=2000 mi, buybackRate=$0.15/mi → buyNow=$300 < turnIn=$500 → buy-now recommended
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const input = renderer!.root.findByProps({ testID: 'buyback-rate-input' });
      await ReactTestRenderer.act(() => {
        input.props.onChangeText('0.15');
      });
      const badge = renderer!.root.findByProps({ testID: 'buyback-buy-now-recommended' });
      expect(badge).toBeDefined();
    });

    it('shows turn-in recommended badge when buyback rate is higher', async () => {
      // overage=2000 mi, buybackRate=$0.35/mi → buyNow=$700 > turnIn=$500 → pay-at-turn-in recommended
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const input = renderer!.root.findByProps({ testID: 'buyback-rate-input' });
      await ReactTestRenderer.act(() => {
        input.props.onChangeText('0.35');
      });
      const badge = renderer!.root.findByProps({ testID: 'buyback-turn-in-recommended' });
      expect(badge).toBeDefined();
    });

    it('shows buy-now cost as — when no rate entered', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const cost = renderer!.root.findByProps({ testID: 'buyback-buy-now-cost' });
      expect(cost.props.children).toBe('—');
    });

    it('shows computed buy-now cost when rate is entered', async () => {
      // overage=2000, rate=$0.15 → $300.00
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const input = renderer!.root.findByProps({ testID: 'buyback-rate-input' });
      await ReactTestRenderer.act(() => {
        input.props.onChangeText('0.15');
      });
      const cost = renderer!.root.findByProps({ testID: 'buyback-buy-now-cost' });
      expect(cost.props.children).toBe('$300.00');
    });

    it('shows savings text when buy-now is recommended', async () => {
      // save $200 (500 - 300)
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const input = renderer!.root.findByProps({ testID: 'buyback-rate-input' });
      await ReactTestRenderer.act(() => {
        input.props.onChangeText('0.15');
      });
      const text = renderer!.root.findByProps({ testID: 'buyback-savings-text' });
      expect(text.props.children).toBe(
        'Buy miles now to save ~$200.00 vs paying at turn-in.',
      );
    });

    it('shows savings text when pay-at-turn-in is recommended', async () => {
      // buyback $0.35/mi: buyNow=$700, turnIn=$500, save $200
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const input = renderer!.root.findByProps({ testID: 'buyback-rate-input' });
      await ReactTestRenderer.act(() => {
        input.props.onChangeText('0.35');
      });
      const text = renderer!.root.findByProps({ testID: 'buyback-savings-text' });
      expect(text.props.children).toBe(
        'Pay at turn-in to save ~$200.00 vs buying miles now.',
      );
    });

    it('does not render premium gate locked for premium users', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<BuybackAnalysisScreen />);
      });
      const locks = renderer!.root.findAllByProps({ testID: 'premium-gate-locked' });
      expect(locks.length).toBe(0);
    });
  });
});

describe('computeBuybackAnalysis', () => {
  it('returns no-action when projectedOverageMiles is 0', () => {
    const result = computeBuybackAnalysis({
      projectedOverageMiles: 0,
      buybackRatePerMile: 0.15,
      overageCostPerMile: 0.25,
    });
    expect(result.recommendation).toBe('no-action');
    expect(result.buyNowCost).toBe(0);
    expect(result.payAtTurnInCost).toBe(0);
    expect(result.savings).toBe(0);
  });

  it('returns no-action when buybackRatePerMile is 0', () => {
    const result = computeBuybackAnalysis({
      projectedOverageMiles: 2000,
      buybackRatePerMile: 0,
      overageCostPerMile: 0.25,
    });
    expect(result.recommendation).toBe('no-action');
    expect(result.buyNowCost).toBe(0);
    // payAtTurnInCost is still computed when there is overage
    expect(result.payAtTurnInCost).toBe(500);
    expect(result.savings).toBe(0);
  });

  it('returns no-action when projectedOverageMiles is negative', () => {
    const result = computeBuybackAnalysis({
      projectedOverageMiles: -500,
      buybackRatePerMile: 0.15,
      overageCostPerMile: 0.25,
    });
    expect(result.recommendation).toBe('no-action');
  });

  it('recommends buy-now when buyback rate is lower than overage rate', () => {
    const result = computeBuybackAnalysis({
      projectedOverageMiles: 2000,
      buybackRatePerMile: 0.15,
      overageCostPerMile: 0.25,
    });
    expect(result.recommendation).toBe('buy-now');
    expect(result.buyNowCost).toBe(300);
    expect(result.payAtTurnInCost).toBe(500);
    expect(result.savings).toBe(200);
  });

  it('recommends pay-at-turn-in when buyback rate is higher than overage rate', () => {
    const result = computeBuybackAnalysis({
      projectedOverageMiles: 2000,
      buybackRatePerMile: 0.35,
      overageCostPerMile: 0.25,
    });
    expect(result.recommendation).toBe('pay-at-turn-in');
    expect(result.buyNowCost).toBe(700);
    expect(result.payAtTurnInCost).toBe(500);
    expect(result.savings).toBe(200);
  });

  it('recommends buy-now when rates are equal (buy-now wins on tie)', () => {
    const result = computeBuybackAnalysis({
      projectedOverageMiles: 1000,
      buybackRatePerMile: 0.25,
      overageCostPerMile: 0.25,
    });
    expect(result.recommendation).toBe('buy-now');
    expect(result.savings).toBe(0);
  });

  it('correctly scales with larger overage amounts', () => {
    const result = computeBuybackAnalysis({
      projectedOverageMiles: 5000,
      buybackRatePerMile: 0.20,
      overageCostPerMile: 0.25,
    });
    expect(result.buyNowCost).toBe(1000);
    expect(result.payAtTurnInCost).toBe(1250);
    expect(result.savings).toBe(250);
    expect(result.recommendation).toBe('buy-now');
  });
});
