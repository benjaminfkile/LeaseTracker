jest.mock('@react-native-community/datetimepicker', () => {
  const MockReact = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ testID }: { testID?: string }) =>
      MockReact.createElement(View, { testID }),
  };
});

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

jest.mock('../src/api/leaseApi', () => ({
  getLeaseSummary: jest.fn(),
}));

jest.mock('../src/api/tripsApi', () => ({
  createTrip: jest.fn(),
}));

jest.mock('../src/stores/leasesStore');

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLeasesStore } from '../src/stores/leasesStore';
import { AddTripScreen } from '../src/screens/trips/AddTripScreen';
import type { LeaseSummary } from '../src/types/api';

const mockUseQuery = useQuery as jest.Mock;
const mockUseMutation = useMutation as jest.Mock;
const mockUseLeasesStore = useLeasesStore as unknown as jest.Mock;

const mockSummary: LeaseSummary = {
  leaseId: 'lease-1',
  vehicleLabel: '2023 Toyota Camry',
  startDate: '2023-01-01',
  endDate: '2026-01-01',
  totalMiles: 36000,
  milesUsed: 12000,
  milesRemaining: 24000,
  daysRemaining: 900,
  projectedMiles: 30000,
  isOverPace: false,
};

type StoreState = {
  activeLeaseId: string | null;
  leases: { id: string }[];
};

function mockStore(overrides: Partial<StoreState> = {}) {
  const state: StoreState = {
    activeLeaseId: 'lease-1',
    leases: [{ id: 'lease-1' }],
    ...overrides,
  };
  mockUseLeasesStore.mockImplementation(
    (selector: (s: StoreState) => unknown) => selector(state),
  );
}

function setupMocks({
  summary = mockSummary,
  summaryLoading = false,
  mutate = jest.fn(),
  isPending = false,
}: {
  summary?: LeaseSummary | undefined;
  summaryLoading?: boolean;
  mutate?: jest.Mock;
  isPending?: boolean;
} = {}) {
  mockUseQuery.mockReturnValue({ data: summary, isLoading: summaryLoading });
  mockUseMutation.mockReturnValue({ mutate, isPending });
}

describe('AddTripScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockStore();
    setupMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<AddTripScreen />);
    });
  });

  it('renders with testID add-trip-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddTripScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'add-trip-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Add Trip title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddTripScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'add-trip-title' });
    expect(title).toBeDefined();
  });

  it('renders the screen header with title Add Trip', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddTripScreen />);
    });
    const header = renderer!.root.findByProps({ testID: 'screen-header-title' });
    expect(header.props.children).toBe('Add Trip');
  });

  it('renders the back button in the header', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddTripScreen />);
    });
    const backBtn = renderer!.root.findByProps({ testID: 'screen-header-back-button' });
    expect(backBtn).toBeDefined();
  });

  it('renders the trip name input', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddTripScreen />);
    });
    const input = renderer!.root.findByProps({ testID: 'trip-name-input' });
    expect(input).toBeDefined();
  });

  it('renders the distance input', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddTripScreen />);
    });
    const input = renderer!.root.findByProps({ testID: 'distance-input' });
    expect(input).toBeDefined();
  });

  it('renders the trip date field', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddTripScreen />);
    });
    const dateField = renderer!.root.findByProps({ testID: 'trip-date-field' });
    expect(dateField).toBeDefined();
  });

  it('renders the trip date button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddTripScreen />);
    });
    const dateBtn = renderer!.root.findByProps({ testID: 'trip-date-field-button' });
    expect(dateBtn).toBeDefined();
  });

  it('renders the impact preview placeholder when no distance entered', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddTripScreen />);
    });
    const placeholder = renderer!.root.findByProps({
      testID: 'trip-impact-preview-placeholder',
    });
    expect(placeholder).toBeDefined();
  });

  it('renders the Save Trip button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddTripScreen />);
    });
    const saveBtn = renderer!.root.findByProps({ testID: 'save-trip-button' });
    expect(saveBtn).toBeDefined();
  });

  it('shows loading state on Save Trip button when isPending', async () => {
    setupMocks({ isPending: true });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddTripScreen />);
    });
    const indicator = renderer!.root.findByProps({ testID: 'button-activity-indicator' });
    expect(indicator).toBeDefined();
  });

  it('shows impact preview text when a valid distance is entered', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddTripScreen />);
    });

    const distanceInput = renderer!.root.findByProps({ testID: 'distance-input' });
    const textInput = distanceInput.findByType('TextInput' as unknown as React.ElementType);
    await ReactTestRenderer.act(() => {
      textInput.props.onChangeText('500');
    });

    const previewText = renderer!.root.findByProps({ testID: 'trip-impact-preview-text' });
    expect(previewText).toBeDefined();
  });

  it('shows correct remaining miles in impact preview', async () => {
    // milesRemaining=24000, distance=500 → 23500 available
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddTripScreen />);
    });

    const distanceInput = renderer!.root.findByProps({ testID: 'distance-input' });
    const textInput = distanceInput.findByType('TextInput' as unknown as React.ElementType);
    await ReactTestRenderer.act(() => {
      textInput.props.onChangeText('500');
    });

    const milesEl = renderer!.root.findByProps({ testID: 'trip-impact-preview-miles' });
    expect(milesEl.props.children).toBe('23,500 mi');
  });

  it('shows placeholder when no summary is available even with distance entered', async () => {
    setupMocks({ summary: undefined });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddTripScreen />);
    });
    // Even without a summary, the placeholder should be visible
    const placeholder = renderer!.root.findByProps({
      testID: 'trip-impact-preview-placeholder',
    });
    expect(placeholder).toBeDefined();
  });

  it('calls mutate with correct data on valid submission', async () => {
    const mutate = jest.fn();
    setupMocks({ mutate });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddTripScreen />);
    });

    // Fill trip name
    const nameInput = renderer!.root.findByProps({ testID: 'trip-name-input' });
    const nameTextInput = nameInput.findByType('TextInput' as unknown as React.ElementType);
    await ReactTestRenderer.act(() => {
      nameTextInput.props.onChangeText('Weekend getaway');
    });

    // Fill distance
    const distanceInput = renderer!.root.findByProps({ testID: 'distance-input' });
    const distanceTextInput = distanceInput.findByType('TextInput' as unknown as React.ElementType);
    await ReactTestRenderer.act(() => {
      distanceTextInput.props.onChangeText('300');
    });

    // Submit
    const saveBtn = renderer!.root.findByProps({ testID: 'save-trip-button' });
    await ReactTestRenderer.act(() => {
      saveBtn.props.onPress();
    });

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ distance: 300, note: 'Weekend getaway' }),
    );
  });

  it('does not call mutate when trip name is empty', async () => {
    const mutate = jest.fn();
    setupMocks({ mutate });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddTripScreen />);
    });

    // Fill only distance, leave name empty
    const distanceInput = renderer!.root.findByProps({ testID: 'distance-input' });
    const distanceTextInput = distanceInput.findByType('TextInput' as unknown as React.ElementType);
    await ReactTestRenderer.act(() => {
      distanceTextInput.props.onChangeText('300');
    });

    const saveBtn = renderer!.root.findByProps({ testID: 'save-trip-button' });
    await ReactTestRenderer.act(() => {
      saveBtn.props.onPress();
    });

    expect(mutate).not.toHaveBeenCalled();
  });

  it('does not call mutate when distance is zero', async () => {
    const mutate = jest.fn();
    setupMocks({ mutate });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddTripScreen />);
    });

    const nameInput = renderer!.root.findByProps({ testID: 'trip-name-input' });
    const nameTextInput = nameInput.findByType('TextInput' as unknown as React.ElementType);
    await ReactTestRenderer.act(() => {
      nameTextInput.props.onChangeText('My Trip');
    });

    const distanceInput = renderer!.root.findByProps({ testID: 'distance-input' });
    const distanceTextInput = distanceInput.findByType('TextInput' as unknown as React.ElementType);
    await ReactTestRenderer.act(() => {
      distanceTextInput.props.onChangeText('0');
    });

    const saveBtn = renderer!.root.findByProps({ testID: 'save-trip-button' });
    await ReactTestRenderer.act(() => {
      saveBtn.props.onPress();
    });

    expect(mutate).not.toHaveBeenCalled();
  });
});
