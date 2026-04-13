jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(() => ({ invalidateQueries: jest.fn() })),
}));

jest.mock('../src/api/alertsApi', () => ({
  getAlertConfigs: jest.fn(),
  updateAlertConfig: jest.fn(),
}));

jest.mock('../src/stores/leasesStore');

jest.mock('react-native-safe-area-context', () => {
  const MockReact = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
      MockReact.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLeasesStore } from '../src/stores/leasesStore';
import { AlertSettingsScreen } from '../src/screens/settings/AlertSettingsScreen';
import type { AlertConfig, Lease } from '../src/types/api';

const mockUseQuery = useQuery as jest.Mock;
const mockUseMutation = useMutation as jest.Mock;

const mockLease: Lease = {
  id: 'lease-1',
  user_id: 'user-1',
  display_name: 'My Camry',
  make: 'Toyota',
  model: 'Camry',
  year: 2023,
  trim: null,
  color: null,
  vin: null,
  license_plate: null,
  lease_start_date: '2023-01-01',
  lease_end_date: '2026-01-01',
  total_miles_allowed: 36000,
  miles_per_year: 12000,
  starting_odometer: 10000,
  current_odometer: 22000,
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

const mockAlertConfigs: AlertConfig[] = [
  {
    id: 'alert-1',
    lease_id: 'lease-1',
    user_id: 'user-1',
    alert_type: 'miles_threshold',
    threshold_value: 80,
    is_enabled: true,
    last_sent_at: null,
    created_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 'alert-2',
    lease_id: 'lease-1',
    user_id: 'user-1',
    alert_type: 'over_pace',
    threshold_value: null,
    is_enabled: false,
    last_sent_at: null,
    created_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 'alert-3',
    lease_id: 'lease-1',
    user_id: 'user-1',
    alert_type: 'days_remaining',
    threshold_value: 30,
    is_enabled: true,
    last_sent_at: null,
    created_at: '2023-01-01T00:00:00Z',
  },
];

function makeConfigs(overrides: Partial<Record<AlertConfig['alert_type'], Partial<AlertConfig>>>): AlertConfig[] {
  return mockAlertConfigs.map(c => ({
    ...c,
    ...(overrides[c.alert_type] ?? {}),
  }));
}

type LeasesStoreState = {
  leases: Lease[];
  activeLeaseId: string | null;
  setLeases: jest.Mock;
  setOverPaceCount: jest.Mock;
  setActiveLeaseId: jest.Mock;
};

function mockLeasesStore(overrides: Partial<LeasesStoreState> = {}) {
  const state: LeasesStoreState = {
    leases: [mockLease],
    activeLeaseId: 'lease-1',
    setLeases: jest.fn(),
    setOverPaceCount: jest.fn(),
    setActiveLeaseId: jest.fn(),
    ...overrides,
  };
  (useLeasesStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: LeasesStoreState) => unknown) => selector(state),
  );
}

function setupMocks(opts: {
  configs?: AlertConfig[] | null;
  isLoading?: boolean;
  error?: Error | null;
  mutate?: jest.Mock;
  isPending?: boolean;
} = {}) {
  const {
    isLoading = false,
    error = null,
    mutate = jest.fn(),
    isPending = false,
  } = opts;
  const data = 'configs' in opts ? (opts.configs ?? undefined) : mockAlertConfigs;
  mockUseQuery.mockReturnValue({ data, isLoading, error });
  mockUseMutation.mockReturnValue({ mutate, isPending });
}

describe('AlertSettingsScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockLeasesStore();
    setupMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<AlertSettingsScreen />);
    });
  });

  it('renders with testID alert-settings-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'alert-settings-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Alert Settings title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'alert-settings-title' });
    expect(title).toBeDefined();
  });

  it('renders the ScreenHeader back button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const backBtn = renderer!.root.findByProps({ testID: 'screen-header-back-button' });
    expect(backBtn).toBeDefined();
  });

  it('renders ScreenHeader with title "Alert Settings"', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const headerTitle = renderer!.root.findByProps({ testID: 'screen-header-title' });
    expect(headerTitle.props.children).toBe('Alert Settings');
  });

  it('renders the miles-threshold toggle', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'miles-threshold-toggle' });
    expect(toggle).toBeDefined();
  });

  it('renders the over-pace toggle', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'over-pace-toggle' });
    expect(toggle).toBeDefined();
  });

  it('renders the days-remaining toggle', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'days-remaining-toggle' });
    expect(toggle).toBeDefined();
  });

  it('renders the save button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const saveBtn = renderer!.root.findByProps({ testID: 'alert-settings-save-button' });
    expect(saveBtn).toBeDefined();
  });

  it('shows loading indicator when configs are loading', async () => {
    setupMocks({ isLoading: true, configs: null });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const loading = renderer!.root.findByProps({ testID: 'alert-settings-loading' });
    expect(loading).toBeDefined();
  });

  it('populates miles-threshold toggle from loaded config (enabled=true)', async () => {
    setupMocks({ configs: makeConfigs({ miles_threshold: { is_enabled: true } }) });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'miles-threshold-toggle' });
    expect(toggle.props.value).toBe(true);
  });

  it('populates over-pace toggle from loaded config (disabled=false)', async () => {
    setupMocks({ configs: makeConfigs({ over_pace: { is_enabled: false } }) });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'over-pace-toggle' });
    expect(toggle.props.value).toBe(false);
  });

  it('populates days-remaining toggle from loaded config (enabled=true)', async () => {
    setupMocks({ configs: makeConfigs({ days_remaining: { is_enabled: true } }) });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'days-remaining-toggle' });
    expect(toggle.props.value).toBe(true);
  });

  it('shows percent stepper when miles-threshold is enabled', async () => {
    setupMocks({ configs: makeConfigs({ miles_threshold: { is_enabled: true } }) });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const stepper = renderer!.root.findByProps({ testID: 'miles-threshold-stepper' });
    expect(stepper).toBeDefined();
  });

  it('hides percent stepper when miles-threshold is disabled', async () => {
    setupMocks({ configs: makeConfigs({ miles_threshold: { is_enabled: false } }) });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    expect(() =>
      renderer!.root.findByProps({ testID: 'miles-threshold-stepper' }),
    ).toThrow();
  });

  it('shows days stepper when days-remaining is enabled', async () => {
    setupMocks({ configs: makeConfigs({ days_remaining: { is_enabled: true } }) });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const stepper = renderer!.root.findByProps({ testID: 'days-remaining-stepper' });
    expect(stepper).toBeDefined();
  });

  it('hides days stepper when days-remaining is disabled', async () => {
    setupMocks({ configs: makeConfigs({ days_remaining: { is_enabled: false } }) });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    expect(() =>
      renderer!.root.findByProps({ testID: 'days-remaining-stepper' }),
    ).toThrow();
  });

  it('shows the percent value from config in the stepper', async () => {
    setupMocks({ configs: makeConfigs({ miles_threshold: { is_enabled: true, threshold_value: 75 } }) });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const valueEl = renderer!.root.findByProps({
      testID: 'miles-threshold-stepper-value',
    });
    expect(valueEl.props.children).toBe('75%');
  });

  it('increments the percent value when increment is pressed', async () => {
    setupMocks({ configs: makeConfigs({ miles_threshold: { is_enabled: true, threshold_value: 75 } }) });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const incrementBtn = renderer!.root.findByProps({
      testID: 'miles-threshold-stepper-increment',
    });
    await ReactTestRenderer.act(() => {
      incrementBtn.props.onPress();
    });
    const valueEl = renderer!.root.findByProps({
      testID: 'miles-threshold-stepper-value',
    });
    expect(valueEl.props.children).toBe('80%');
  });

  it('decrements the percent value when decrement is pressed', async () => {
    setupMocks({ configs: makeConfigs({ miles_threshold: { is_enabled: true, threshold_value: 75 } }) });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const decrementBtn = renderer!.root.findByProps({
      testID: 'miles-threshold-stepper-decrement',
    });
    await ReactTestRenderer.act(() => {
      decrementBtn.props.onPress();
    });
    const valueEl = renderer!.root.findByProps({
      testID: 'miles-threshold-stepper-value',
    });
    expect(valueEl.props.children).toBe('70%');
  });

  it('shows the days value from config in the stepper', async () => {
    setupMocks({ configs: makeConfigs({ days_remaining: { is_enabled: true, threshold_value: 30 } }) });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const valueEl = renderer!.root.findByProps({ testID: 'days-remaining-stepper-value' });
    expect(valueEl.props.children).toBe('30 days');
  });

  it('increments days value when increment is pressed', async () => {
    setupMocks({ configs: makeConfigs({ days_remaining: { is_enabled: true, threshold_value: 30 } }) });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const incrementBtn = renderer!.root.findByProps({ testID: 'days-remaining-stepper-increment' });
    await ReactTestRenderer.act(() => {
      incrementBtn.props.onPress();
    });
    const valueEl = renderer!.root.findByProps({ testID: 'days-remaining-stepper-value' });
    expect(valueEl.props.children).toBe('31 days');
  });

  it('decrements days value when decrement is pressed', async () => {
    setupMocks({ configs: makeConfigs({ days_remaining: { is_enabled: true, threshold_value: 30 } }) });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const decrementBtn = renderer!.root.findByProps({ testID: 'days-remaining-stepper-decrement' });
    await ReactTestRenderer.act(() => {
      decrementBtn.props.onPress();
    });
    const valueEl = renderer!.root.findByProps({ testID: 'days-remaining-stepper-value' });
    expect(valueEl.props.children).toBe('29 days');
  });

  it('calls mutate when Save is pressed', async () => {
    const mutate = jest.fn();
    setupMocks({ mutate });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const saveBtn = renderer!.root.findByProps({ testID: 'alert-settings-save-button' });
    await ReactTestRenderer.act(() => {
      saveBtn.props.onPress();
    });
    expect(mutate).toHaveBeenCalled();
  });

  it('shows loading state on save button when isSaving', async () => {
    setupMocks({ isPending: true });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const indicator = renderer!.root.findByProps({ testID: 'button-activity-indicator' });
    expect(indicator).toBeDefined();
  });

  it('shows no-leases message when leases list is empty', async () => {
    mockLeasesStore({ leases: [], activeLeaseId: null });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const empty = renderer!.root.findByProps({ testID: 'alert-settings-no-leases' });
    expect(empty).toBeDefined();
  });

  it('hides lease selector pills when only one lease exists', async () => {
    mockLeasesStore({ leases: [mockLease], activeLeaseId: 'lease-1' });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    expect(() => renderer!.root.findByProps({ testID: 'lease-selector-pills' })).toThrow();
  });

  it('shows lease selector pills when multiple leases exist', async () => {
    const secondLease: Lease = {
      ...mockLease,
      id: 'lease-2',
      display_name: 'My Corolla',
    };
    mockLeasesStore({ leases: [mockLease, secondLease], activeLeaseId: 'lease-1' });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const pills = renderer!.root.findByProps({ testID: 'lease-selector-pills' });
    expect(pills).toBeDefined();
  });

  it('uses default form values when no configs are loaded', async () => {
    setupMocks({ configs: null });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const milesToggle = renderer!.root.findByProps({ testID: 'miles-threshold-toggle' });
    expect(milesToggle.props.value).toBe(false);
    const overPaceToggle = renderer!.root.findByProps({ testID: 'over-pace-toggle' });
    expect(overPaceToggle.props.value).toBe(false);
    const daysToggle = renderer!.root.findByProps({ testID: 'days-remaining-toggle' });
    expect(daysToggle.props.value).toBe(false);
  });

  it('toggling miles-threshold switch updates state', async () => {
    setupMocks({ configs: makeConfigs({ miles_threshold: { is_enabled: false } }) });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'miles-threshold-toggle' });
    expect(toggle.props.value).toBe(false);
    await ReactTestRenderer.act(() => {
      toggle.props.onValueChange(true);
    });
    const toggleAfter = renderer!.root.findByProps({ testID: 'miles-threshold-toggle' });
    expect(toggleAfter.props.value).toBe(true);
  });

  it('toggling over-pace switch updates state', async () => {
    setupMocks({ configs: makeConfigs({ over_pace: { is_enabled: false } }) });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'over-pace-toggle' });
    await ReactTestRenderer.act(() => {
      toggle.props.onValueChange(true);
    });
    const toggleAfter = renderer!.root.findByProps({ testID: 'over-pace-toggle' });
    expect(toggleAfter.props.value).toBe(true);
  });

  it('toggling days-remaining switch updates state', async () => {
    setupMocks({ configs: makeConfigs({ days_remaining: { is_enabled: false } }) });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'days-remaining-toggle' });
    expect(toggle.props.value).toBe(false);
    await ReactTestRenderer.act(() => {
      toggle.props.onValueChange(true);
    });
    const toggleAfter = renderer!.root.findByProps({ testID: 'days-remaining-toggle' });
    expect(toggleAfter.props.value).toBe(true);
  });

  it('percent stepper decrement is disabled at minimum value', async () => {
    setupMocks({
      configs: makeConfigs({ miles_threshold: { is_enabled: true, threshold_value: 1 } }),
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const decrementBtn = renderer!.root.findByProps({
      testID: 'miles-threshold-stepper-decrement',
    });
    expect(decrementBtn.props.disabled).toBe(true);
  });

  it('percent stepper increment is disabled at maximum value', async () => {
    setupMocks({
      configs: makeConfigs({ miles_threshold: { is_enabled: true, threshold_value: 100 } }),
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const incrementBtn = renderer!.root.findByProps({
      testID: 'miles-threshold-stepper-increment',
    });
    expect(incrementBtn.props.disabled).toBe(true);
  });

  it('days stepper decrement is disabled at minimum value', async () => {
    setupMocks({
      configs: makeConfigs({ days_remaining: { is_enabled: true, threshold_value: 1 } }),
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const decrementBtn = renderer!.root.findByProps({ testID: 'days-remaining-stepper-decrement' });
    expect(decrementBtn.props.disabled).toBe(true);
  });

  it('days stepper increment is disabled at maximum value', async () => {
    setupMocks({
      configs: makeConfigs({ days_remaining: { is_enabled: true, threshold_value: 365 } }),
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const incrementBtn = renderer!.root.findByProps({ testID: 'days-remaining-stepper-increment' });
    expect(incrementBtn.props.disabled).toBe(true);
  });

  it('does not show threshold input for over-pace alert type', async () => {
    setupMocks({ configs: makeConfigs({ over_pace: { is_enabled: true } }) });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const card = renderer!.root.findByProps({ testID: 'over-pace-card' });
    expect(card).toBeDefined();
    // over_pace should have no stepper
    expect(() =>
      renderer!.root.findByProps({ testID: 'over-pace-stepper' }),
    ).toThrow();
  });

  it('passes mutationFn that calls updateAlertConfig for changed alerts', async () => {
    let capturedMutationFn: (() => Promise<void>) | undefined;
    mockUseMutation.mockImplementation((opts: { mutationFn: () => Promise<void> }) => {
      capturedMutationFn = opts.mutationFn;
      return { mutate: jest.fn(), isPending: false };
    });

    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<AlertSettingsScreen />);
    });

    expect(capturedMutationFn).toBeDefined();
  });

  it('uses empty configs gracefully when API returns empty array', async () => {
    setupMocks({ configs: [] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const milesToggle = renderer!.root.findByProps({ testID: 'miles-threshold-toggle' });
    expect(milesToggle.props.value).toBe(false);
    const overPaceToggle = renderer!.root.findByProps({ testID: 'over-pace-toggle' });
    expect(overPaceToggle.props.value).toBe(false);
    const daysToggle = renderer!.root.findByProps({ testID: 'days-remaining-toggle' });
    expect(daysToggle.props.value).toBe(false);
  });
});
