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
  getAlertConfig: jest.fn(),
  updateAlertConfig: jest.fn(),
}));

jest.mock('../src/stores/leasesStore');

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn().mockResolvedValue('default'),
    displayNotification: jest.fn().mockResolvedValue(undefined),
  },
  AndroidImportance: { HIGH: 4 },
}));

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
  userId: 'user-1',
  vehicleYear: 2023,
  vehicleMake: 'Toyota',
  vehicleModel: 'Camry',
  startDate: '2023-01-01',
  endDate: '2026-01-01',
  totalMiles: 36000,
  startingMileage: 10000,
  currentMileage: 22000,
  monthlyMiles: 1000,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
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
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

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
  config?: AlertConfig | null;
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
  const data = 'config' in opts ? (opts.config ?? undefined) : mockAlertConfig;
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

  it('renders the approaching-limit toggle', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'approaching-limit-toggle' });
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

  it('renders the lease-end toggle', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'lease-end-toggle' });
    expect(toggle).toBeDefined();
  });

  it('renders the saved-trip toggle', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'saved-trip-toggle' });
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

  it('shows loading indicator when config is loading', async () => {
    setupMocks({ isLoading: true, config: null });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const loading = renderer!.root.findByProps({ testID: 'alert-settings-loading' });
    expect(loading).toBeDefined();
  });

  it('populates approaching-limit toggle from loaded config (enabled=true)', async () => {
    setupMocks({ config: { ...mockAlertConfig, approachingLimitEnabled: true } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'approaching-limit-toggle' });
    expect(toggle.props.value).toBe(true);
  });

  it('populates over-pace toggle from loaded config (disabled=false)', async () => {
    setupMocks({ config: { ...mockAlertConfig, overPaceEnabled: false } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'over-pace-toggle' });
    expect(toggle.props.value).toBe(false);
  });

  it('populates lease-end toggle from loaded config (enabled=true)', async () => {
    setupMocks({ config: { ...mockAlertConfig, leaseEndEnabled: true } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'lease-end-toggle' });
    expect(toggle.props.value).toBe(true);
  });

  it('shows percent stepper when approaching-limit is enabled', async () => {
    setupMocks({ config: { ...mockAlertConfig, approachingLimitEnabled: true } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const stepper = renderer!.root.findByProps({ testID: 'approaching-limit-percent-stepper' });
    expect(stepper).toBeDefined();
  });

  it('hides percent stepper when approaching-limit is disabled', async () => {
    setupMocks({ config: { ...mockAlertConfig, approachingLimitEnabled: false } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    expect(() =>
      renderer!.root.findByProps({ testID: 'approaching-limit-percent-stepper' }),
    ).toThrow();
  });

  it('shows days stepper when lease-end is enabled', async () => {
    setupMocks({ config: { ...mockAlertConfig, leaseEndEnabled: true } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const stepper = renderer!.root.findByProps({ testID: 'lease-end-days-stepper' });
    expect(stepper).toBeDefined();
  });

  it('hides days stepper when lease-end is disabled', async () => {
    setupMocks({ config: { ...mockAlertConfig, leaseEndEnabled: false } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    expect(() =>
      renderer!.root.findByProps({ testID: 'lease-end-days-stepper' }),
    ).toThrow();
  });

  it('shows the percent value from config in the stepper', async () => {
    setupMocks({ config: { ...mockAlertConfig, approachingLimitEnabled: true, approachingLimitPercent: 75 } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const valueEl = renderer!.root.findByProps({
      testID: 'approaching-limit-percent-stepper-value',
    });
    expect(valueEl.props.children).toBe('75%');
  });

  it('increments the percent value when increment is pressed', async () => {
    setupMocks({ config: { ...mockAlertConfig, approachingLimitEnabled: true, approachingLimitPercent: 75 } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const incrementBtn = renderer!.root.findByProps({
      testID: 'approaching-limit-percent-stepper-increment',
    });
    await ReactTestRenderer.act(() => {
      incrementBtn.props.onPress();
    });
    const valueEl = renderer!.root.findByProps({
      testID: 'approaching-limit-percent-stepper-value',
    });
    expect(valueEl.props.children).toBe('80%');
  });

  it('decrements the percent value when decrement is pressed', async () => {
    setupMocks({ config: { ...mockAlertConfig, approachingLimitEnabled: true, approachingLimitPercent: 75 } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const decrementBtn = renderer!.root.findByProps({
      testID: 'approaching-limit-percent-stepper-decrement',
    });
    await ReactTestRenderer.act(() => {
      decrementBtn.props.onPress();
    });
    const valueEl = renderer!.root.findByProps({
      testID: 'approaching-limit-percent-stepper-value',
    });
    expect(valueEl.props.children).toBe('70%');
  });

  it('shows the days value from config in the stepper', async () => {
    setupMocks({ config: { ...mockAlertConfig, leaseEndEnabled: true, leaseEndDays: 30 } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const valueEl = renderer!.root.findByProps({ testID: 'lease-end-days-stepper-value' });
    expect(valueEl.props.children).toBe('30 days');
  });

  it('increments days value when increment is pressed', async () => {
    setupMocks({ config: { ...mockAlertConfig, leaseEndEnabled: true, leaseEndDays: 30 } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const incrementBtn = renderer!.root.findByProps({ testID: 'lease-end-days-stepper-increment' });
    await ReactTestRenderer.act(() => {
      incrementBtn.props.onPress();
    });
    const valueEl = renderer!.root.findByProps({ testID: 'lease-end-days-stepper-value' });
    expect(valueEl.props.children).toBe('31 days');
  });

  it('decrements days value when decrement is pressed', async () => {
    setupMocks({ config: { ...mockAlertConfig, leaseEndEnabled: true, leaseEndDays: 30 } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const decrementBtn = renderer!.root.findByProps({ testID: 'lease-end-days-stepper-decrement' });
    await ReactTestRenderer.act(() => {
      decrementBtn.props.onPress();
    });
    const valueEl = renderer!.root.findByProps({ testID: 'lease-end-days-stepper-value' });
    expect(valueEl.props.children).toBe('29 days');
  });

  it('shows saved-trip note text', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const note = renderer!.root.findByProps({ testID: 'saved-trip-note' });
    expect(note).toBeDefined();
  });

  it('calls mutate with correct payload when Save is pressed', async () => {
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
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        approachingLimitEnabled: true,
        approachingLimitPercent: 80,
        overPaceEnabled: false,
        leaseEndEnabled: true,
        leaseEndDays: 30,
        savedTripEnabled: false,
      }),
    );
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
      vehicleModel: 'Corolla',
    };
    mockLeasesStore({ leases: [mockLease, secondLease], activeLeaseId: 'lease-1' });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const pills = renderer!.root.findByProps({ testID: 'lease-selector-pills' });
    expect(pills).toBeDefined();
  });

  it('renders the test notification button in __DEV__ mode', async () => {
    // __DEV__ is true in Jest/test environment
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const btn = renderer!.root.findByProps({ testID: 'test-notification-button' });
    expect(btn).toBeDefined();
  });

  it('uses default form values when no config is loaded', async () => {
    setupMocks({ config: null });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const approachingToggle = renderer!.root.findByProps({ testID: 'approaching-limit-toggle' });
    expect(approachingToggle.props.value).toBe(false);
    const overPaceToggle = renderer!.root.findByProps({ testID: 'over-pace-toggle' });
    expect(overPaceToggle.props.value).toBe(false);
  });

  it('toggling approaching-limit switch updates state', async () => {
    setupMocks({ config: { ...mockAlertConfig, approachingLimitEnabled: false } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'approaching-limit-toggle' });
    expect(toggle.props.value).toBe(false);
    await ReactTestRenderer.act(() => {
      toggle.props.onValueChange(true);
    });
    const toggleAfter = renderer!.root.findByProps({ testID: 'approaching-limit-toggle' });
    expect(toggleAfter.props.value).toBe(true);
  });

  it('toggling over-pace switch updates state', async () => {
    setupMocks({ config: { ...mockAlertConfig, overPaceEnabled: false } });
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

  it('percent stepper decrement is disabled at minimum value', async () => {
    setupMocks({
      config: { ...mockAlertConfig, approachingLimitEnabled: true, approachingLimitPercent: 1 },
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const decrementBtn = renderer!.root.findByProps({
      testID: 'approaching-limit-percent-stepper-decrement',
    });
    expect(decrementBtn.props.disabled).toBe(true);
  });

  it('percent stepper increment is disabled at maximum value', async () => {
    setupMocks({
      config: { ...mockAlertConfig, approachingLimitEnabled: true, approachingLimitPercent: 100 },
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const incrementBtn = renderer!.root.findByProps({
      testID: 'approaching-limit-percent-stepper-increment',
    });
    expect(incrementBtn.props.disabled).toBe(true);
  });

  it('days stepper decrement is disabled at minimum value', async () => {
    setupMocks({
      config: { ...mockAlertConfig, leaseEndEnabled: true, leaseEndDays: 1 },
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const decrementBtn = renderer!.root.findByProps({ testID: 'lease-end-days-stepper-decrement' });
    expect(decrementBtn.props.disabled).toBe(true);
  });

  it('days stepper increment is disabled at maximum value', async () => {
    setupMocks({
      config: { ...mockAlertConfig, leaseEndEnabled: true, leaseEndDays: 365 },
    });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AlertSettingsScreen />);
    });
    const incrementBtn = renderer!.root.findByProps({ testID: 'lease-end-days-stepper-increment' });
    expect(incrementBtn.props.disabled).toBe(true);
  });
});

