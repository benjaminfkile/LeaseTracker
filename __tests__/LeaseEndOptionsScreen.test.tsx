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
  LeaseEndOptionsScreen,
  computeLeaseEndOptions,
} from '../src/screens/home/LeaseEndOptionsScreen';
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

describe('LeaseEndOptionsScreen', () => {
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
      ReactTestRenderer.create(<LeaseEndOptionsScreen />);
    });
  });

  it('renders with testID lease-end-options-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'lease-end-options-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Lease End Options title for premium users', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'lease-end-options-title' });
    expect(title).toBeDefined();
    expect(title.props.children).toBe('Lease End Options');
  });

  it('shows loading indicator when lease data is loading', async () => {
    setupQueryMocks({ leaseLoading: true });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
    });
    const loading = renderer!.root.findByProps({ testID: 'lease-end-options-loading' });
    expect(loading).toBeDefined();
  });

  it('shows loading indicator when summary data is loading', async () => {
    setupQueryMocks({ summaryLoading: true });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
    });
    const loading = renderer!.root.findByProps({ testID: 'lease-end-options-loading' });
    expect(loading).toBeDefined();
  });

  it('shows error message when lease fails to load', async () => {
    setupQueryMocks({ leaseError: new Error('Network error') });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'lease-end-options-screen' });
    expect(screen).toBeDefined();
    const titles = renderer!.root.findAllByProps({ testID: 'lease-end-options-title' });
    expect(titles.length).toBe(0);
  });

  describe('premium gate (free tier)', () => {
    beforeEach(() => {
      setupQueryMocks({ subscription: mockSubscriptionFree });
    });

    it('renders the premium lock overlay for free users', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const locked = renderer!.root.findByProps({ testID: 'premium-gate-locked' });
      expect(locked).toBeDefined();
    });

    it('renders the premium gate title', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const title = renderer!.root.findByProps({ testID: 'premium-gate-title' });
      expect(title).toBeDefined();
      expect(title.props.children).toBe('Premium Feature');
    });

    it('renders the upgrade button for free users', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const btn = renderer!.root.findByProps({ testID: 'premium-gate-upgrade-button' });
      expect(btn).toBeDefined();
    });

    it('does not render the analysis content for free users', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const titles = renderer!.root.findAllByProps({ testID: 'lease-end-options-title' });
      expect(titles.length).toBe(0);
    });
  });

  describe('premium users — full UI', () => {
    it('renders back button', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const back = renderer!.root.findByProps({ testID: 'lease-end-options-back' });
      expect(back).toBeDefined();
    });

    it('renders scroll view', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const scroll = renderer!.root.findByProps({ testID: 'lease-end-options-scroll' });
      expect(scroll).toBeDefined();
    });

    it('renders vehicle label section', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const label = renderer!.root.findByProps({ testID: 'lease-end-vehicle-label' });
      expect(label).toBeDefined();
    });

    it('renders inputs section', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const section = renderer!.root.findByProps({ testID: 'lease-end-inputs-section' });
      expect(section).toBeDefined();
    });

    it('renders buyout input', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const input = renderer!.root.findByProps({ testID: 'lease-end-buyout-input' });
      expect(input).toBeDefined();
    });

    it('renders monthly payment input', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const input = renderer!.root.findByProps({ testID: 'lease-end-monthly-input' });
      expect(input).toBeDefined();
    });

    it('renders lease term input', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const input = renderer!.root.findByProps({ testID: 'lease-end-term-input' });
      expect(input).toBeDefined();
    });

    it('renders comparison section', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const section = renderer!.root.findByProps({ testID: 'lease-end-comparison-section' });
      expect(section).toBeDefined();
    });

    it('renders all three comparison cards', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      expect(renderer!.root.findByProps({ testID: 'lease-end-return-card' })).toBeDefined();
      expect(renderer!.root.findByProps({ testID: 'lease-end-buyout-card' })).toBeDefined();
      expect(renderer!.root.findByProps({ testID: 'lease-end-roll-card' })).toBeDefined();
    });

    it('shows return cost based on projected overage', async () => {
      // projectedMiles=38000, totalMiles=36000 → overage=2000 mi
      // returnCost = 2000 * $0.25 = $500.00
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const cost = renderer!.root.findByProps({ testID: 'lease-end-return-cost' });
      expect(cost.props.children).toBe('$500.00');
    });

    it('shows $0.00 return cost when on pace', async () => {
      setupQueryMocks({ summary: mockSummaryOnPace });
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const cost = renderer!.root.findByProps({ testID: 'lease-end-return-cost' });
      expect(cost.props.children).toBe('$0.00');
    });

    it('shows — for buyout cost when no amount is entered', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const cost = renderer!.root.findByProps({ testID: 'lease-end-buyout-cost' });
      expect(cost.props.children).toBe('—');
    });

    it('shows computed buyout cost when amount is entered', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const input = renderer!.root.findByProps({ testID: 'lease-end-buyout-input' });
      await ReactTestRenderer.act(() => {
        input.props.onChangeText('15000');
      });
      const cost = renderer!.root.findByProps({ testID: 'lease-end-buyout-cost' });
      expect(cost.props.children).toBe('$15000.00');
    });

    it('shows — for roll cost when monthly and term are not entered', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const cost = renderer!.root.findByProps({ testID: 'lease-end-roll-cost' });
      expect(cost.props.children).toBe('—');
    });

    it('shows — for roll cost when only monthly is entered', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const monthlyInput = renderer!.root.findByProps({ testID: 'lease-end-monthly-input' });
      await ReactTestRenderer.act(() => {
        monthlyInput.props.onChangeText('400');
      });
      const cost = renderer!.root.findByProps({ testID: 'lease-end-roll-cost' });
      expect(cost.props.children).toBe('—');
    });

    it('shows computed roll cost when monthly and term are entered', async () => {
      // 400/mo × 36 mo = $14,400
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const monthlyInput = renderer!.root.findByProps({ testID: 'lease-end-monthly-input' });
      const termInput = renderer!.root.findByProps({ testID: 'lease-end-term-input' });
      await ReactTestRenderer.act(() => {
        monthlyInput.props.onChangeText('400');
        termInput.props.onChangeText('36');
      });
      const cost = renderer!.root.findByProps({ testID: 'lease-end-roll-cost' });
      expect(cost.props.children).toBe('$14400.00');
    });

    it('does not show recommendation section until all inputs are provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const sections = renderer!.root.findAllByProps({ testID: 'lease-end-recommendation-section' });
      expect(sections.length).toBe(0);
    });

    it('shows recommendation section when all inputs are provided', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const buyoutInput = renderer!.root.findByProps({ testID: 'lease-end-buyout-input' });
      const monthlyInput = renderer!.root.findByProps({ testID: 'lease-end-monthly-input' });
      const termInput = renderer!.root.findByProps({ testID: 'lease-end-term-input' });
      await ReactTestRenderer.act(() => {
        buyoutInput.props.onChangeText('15000');
        monthlyInput.props.onChangeText('400');
        termInput.props.onChangeText('36');
      });
      const section = renderer!.root.findByProps({ testID: 'lease-end-recommendation-section' });
      expect(section).toBeDefined();
    });

    it('shows buy-out recommended badge when buyout is cheapest', async () => {
      // Return=$500, BuyOut=$400, Roll=$14400 → BuyOut wins
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const buyoutInput = renderer!.root.findByProps({ testID: 'lease-end-buyout-input' });
      const monthlyInput = renderer!.root.findByProps({ testID: 'lease-end-monthly-input' });
      const termInput = renderer!.root.findByProps({ testID: 'lease-end-term-input' });
      await ReactTestRenderer.act(() => {
        buyoutInput.props.onChangeText('400');
        monthlyInput.props.onChangeText('400');
        termInput.props.onChangeText('36');
      });
      const badge = renderer!.root.findByProps({ testID: 'lease-end-buyout-recommended' });
      expect(badge).toBeDefined();
    });

    it('shows return recommended badge when return is cheapest', async () => {
      // Return=$0 (on pace), BuyOut=$15000, Roll=$14400 → Return wins
      setupQueryMocks({ summary: mockSummaryOnPace });
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const buyoutInput = renderer!.root.findByProps({ testID: 'lease-end-buyout-input' });
      const monthlyInput = renderer!.root.findByProps({ testID: 'lease-end-monthly-input' });
      const termInput = renderer!.root.findByProps({ testID: 'lease-end-term-input' });
      await ReactTestRenderer.act(() => {
        buyoutInput.props.onChangeText('15000');
        monthlyInput.props.onChangeText('400');
        termInput.props.onChangeText('36');
      });
      const badge = renderer!.root.findByProps({ testID: 'lease-end-return-recommended' });
      expect(badge).toBeDefined();
    });

    it('shows roll-to-new recommended badge when roll is cheapest', async () => {
      // Return=$500, BuyOut=$15000, Roll=$300 (100/mo × 3 mo) → Roll wins
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const buyoutInput = renderer!.root.findByProps({ testID: 'lease-end-buyout-input' });
      const monthlyInput = renderer!.root.findByProps({ testID: 'lease-end-monthly-input' });
      const termInput = renderer!.root.findByProps({ testID: 'lease-end-term-input' });
      await ReactTestRenderer.act(() => {
        buyoutInput.props.onChangeText('15000');
        monthlyInput.props.onChangeText('100');
        termInput.props.onChangeText('3');
      });
      const badge = renderer!.root.findByProps({ testID: 'lease-end-roll-recommended' });
      expect(badge).toBeDefined();
    });

    it('shows recommendation text for cheapest buy-out', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const buyoutInput = renderer!.root.findByProps({ testID: 'lease-end-buyout-input' });
      const monthlyInput = renderer!.root.findByProps({ testID: 'lease-end-monthly-input' });
      const termInput = renderer!.root.findByProps({ testID: 'lease-end-term-input' });
      await ReactTestRenderer.act(() => {
        buyoutInput.props.onChangeText('400');
        monthlyInput.props.onChangeText('400');
        termInput.props.onChangeText('36');
      });
      const text = renderer!.root.findByProps({ testID: 'lease-end-recommendation-text' });
      expect(text.props.children).toBe('Buying out the vehicle is your lowest-cost option.');
    });

    it('shows recommendation text for cheapest return', async () => {
      setupQueryMocks({ summary: mockSummaryOnPace });
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const buyoutInput = renderer!.root.findByProps({ testID: 'lease-end-buyout-input' });
      const monthlyInput = renderer!.root.findByProps({ testID: 'lease-end-monthly-input' });
      const termInput = renderer!.root.findByProps({ testID: 'lease-end-term-input' });
      await ReactTestRenderer.act(() => {
        buyoutInput.props.onChangeText('15000');
        monthlyInput.props.onChangeText('400');
        termInput.props.onChangeText('36');
      });
      const text = renderer!.root.findByProps({ testID: 'lease-end-recommendation-text' });
      expect(text.props.children).toBe('Returning the vehicle is your lowest-cost option.');
    });

    it('shows recommendation text for cheapest roll-to-new', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const buyoutInput = renderer!.root.findByProps({ testID: 'lease-end-buyout-input' });
      const monthlyInput = renderer!.root.findByProps({ testID: 'lease-end-monthly-input' });
      const termInput = renderer!.root.findByProps({ testID: 'lease-end-term-input' });
      await ReactTestRenderer.act(() => {
        buyoutInput.props.onChangeText('15000');
        monthlyInput.props.onChangeText('100');
        termInput.props.onChangeText('3');
      });
      const text = renderer!.root.findByProps({ testID: 'lease-end-recommendation-text' });
      expect(text.props.children).toBe('Rolling to a new lease is your lowest-cost option.');
    });

    it('does not render premium gate locked for premium users', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<LeaseEndOptionsScreen />);
      });
      const locks = renderer!.root.findAllByProps({ testID: 'premium-gate-locked' });
      expect(locks.length).toBe(0);
    });
  });
});

describe('computeLeaseEndOptions', () => {
  it('return is cheapest when on pace (overage=0) and other costs are high', () => {
    const result = computeLeaseEndOptions({
      projectedOverageMiles: 0,
      overageCostPerMile: 0.25,
      buyOutAmount: 15000,
      newMonthlyPayment: 400,
      newLeaseTerm: 36,
    });
    expect(result.returnCost).toBe(0);
    expect(result.buyOutCost).toBe(15000);
    expect(result.rollToNewCost).toBe(14400);
    expect(result.cheapest).toBe('return');
  });

  it('buy-out is cheapest when residual is lower than overage and roll total', () => {
    const result = computeLeaseEndOptions({
      projectedOverageMiles: 2000,
      overageCostPerMile: 0.25,
      buyOutAmount: 400,
      newMonthlyPayment: 400,
      newLeaseTerm: 36,
    });
    expect(result.returnCost).toBe(500);
    expect(result.buyOutCost).toBe(400);
    expect(result.rollToNewCost).toBe(14400);
    expect(result.cheapest).toBe('buy-out');
  });

  it('roll-to-new is cheapest when monthly × term is lowest', () => {
    const result = computeLeaseEndOptions({
      projectedOverageMiles: 2000,
      overageCostPerMile: 0.25,
      buyOutAmount: 15000,
      newMonthlyPayment: 100,
      newLeaseTerm: 3,
    });
    expect(result.returnCost).toBe(500);
    expect(result.buyOutCost).toBe(15000);
    expect(result.rollToNewCost).toBe(300);
    expect(result.cheapest).toBe('roll-to-new');
  });

  it('return wins when there is a tie with buy-out (first one wins)', () => {
    const result = computeLeaseEndOptions({
      projectedOverageMiles: 1000,
      overageCostPerMile: 0.25,
      buyOutAmount: 250,
      newMonthlyPayment: 400,
      newLeaseTerm: 36,
    });
    expect(result.returnCost).toBe(250);
    expect(result.buyOutCost).toBe(250);
    // return wins on tie
    expect(result.cheapest).toBe('return');
  });

  it('clamps negative overage to zero for return cost', () => {
    const result = computeLeaseEndOptions({
      projectedOverageMiles: -500,
      overageCostPerMile: 0.25,
      buyOutAmount: 15000,
      newMonthlyPayment: 400,
      newLeaseTerm: 36,
    });
    expect(result.returnCost).toBe(0);
  });

  it('clamps negative buyout to zero', () => {
    const result = computeLeaseEndOptions({
      projectedOverageMiles: 1000,
      overageCostPerMile: 0.25,
      buyOutAmount: -500,
      newMonthlyPayment: 400,
      newLeaseTerm: 36,
    });
    expect(result.buyOutCost).toBe(0);
  });

  it('clamps negative monthly payment to zero for roll cost', () => {
    const result = computeLeaseEndOptions({
      projectedOverageMiles: 1000,
      overageCostPerMile: 0.25,
      buyOutAmount: 15000,
      newMonthlyPayment: -200,
      newLeaseTerm: 36,
    });
    expect(result.rollToNewCost).toBe(0);
  });

  it('correctly computes large values', () => {
    const result = computeLeaseEndOptions({
      projectedOverageMiles: 5000,
      overageCostPerMile: 0.30,
      buyOutAmount: 20000,
      newMonthlyPayment: 500,
      newLeaseTerm: 48,
    });
    expect(result.returnCost).toBe(1500);
    expect(result.buyOutCost).toBe(20000);
    expect(result.rollToNewCost).toBe(24000);
    expect(result.cheapest).toBe('return');
  });
});
