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
  useRoute: () => ({
    params: { tripId: 'trip-1', leaseId: 'lease-1' },
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
  getTrips: jest.fn(),
  updateTrip: jest.fn(),
  deleteTrip: jest.fn(),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useQuery, useMutation } from '@tanstack/react-query';
import { EditTripScreen } from '../src/screens/trips/EditTripScreen';
import type { LeaseSummary, SavedTrip } from '../src/types/api';

const mockUseQuery = useQuery as jest.Mock;
const mockUseMutation = useMutation as jest.Mock;

const mockTrip: SavedTrip = {
  id: 'trip-1',
  lease_id: 'lease-1',
  user_id: 'user-1',
  name: 'Weekend getaway',
  estimated_miles: 250,
  trip_date: '2024-06-15',
  notes: null,
  is_completed: false,
  created_at: '2024-06-15T00:00:00Z',
  updated_at: '2024-06-15T00:00:00Z',
};

const mockSummary: LeaseSummary = {
  miles_driven: 12000,
  miles_remaining: 24000,
  days_elapsed: 365,
  days_remaining: 900,
  lease_length_days: 1095,
  expected_miles_to_date: 12000,
  current_pace_per_month: 1000,
  pace_status: 'on_track',
  miles_over_under_pace: 0,
  projected_miles_at_end: 30000,
  projected_overage: 0,
  projected_overage_cost: 0,
  recommended_daily_miles: 27,
  reserved_trip_miles: 0,
  is_premium: false,
};

function setupMocks({
  tripsData = { active: [mockTrip], completed: [] },
  tripsLoading = false,
  summary = mockSummary,
  mutate = jest.fn(),
  removeMutate = jest.fn(),
  isSaving = false,
  isDeleting = false,
}: {
  tripsData?: { active: SavedTrip[]; completed: SavedTrip[] } | undefined;
  tripsLoading?: boolean;
  summary?: LeaseSummary | undefined;
  mutate?: jest.Mock;
  removeMutate?: jest.Mock;
  isSaving?: boolean;
  isDeleting?: boolean;
} = {}) {
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[0] === 'trips') {
      return { data: tripsData, isLoading: tripsLoading };
    }
    if (queryKey[0] === 'lease-summary') {
      return { data: summary, isLoading: false };
    }
    return { data: undefined, isLoading: false };
  });
  // useMutation is called twice: first for saveTrip, second for removeTrip
  let mutationCallCount = 0;
  mockUseMutation.mockImplementation(() => {
    const idx = mutationCallCount % 2;
    mutationCallCount++;
    return idx === 0
      ? { mutate, isPending: isSaving }
      : { mutate: removeMutate, isPending: isDeleting };
  });
}

function findTextInput(
  renderer: ReactTestRenderer.ReactTestRenderer,
  testID: string,
): ReactTestRenderer.ReactTestInstance {
  const wrapper = renderer.root.findByProps({ testID });
  return wrapper.findByType('TextInput' as unknown as React.ElementType);
}

describe('EditTripScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setupMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<EditTripScreen />);
    });
  });

  it('renders with testID edit-trip-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'edit-trip-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Edit Trip title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'edit-trip-title' });
    expect(title).toBeDefined();
  });

  it('renders the screen header with title Edit Trip', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });
    const header = renderer!.root.findByProps({ testID: 'screen-header-title' });
    expect(header.props.children).toBe('Edit Trip');
  });

  it('renders the back button in the header', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });
    const backBtn = renderer!.root.findByProps({ testID: 'screen-header-back-button' });
    expect(backBtn).toBeDefined();
  });

  it('renders the trip name input', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });
    const input = renderer!.root.findByProps({ testID: 'trip-name-input' });
    expect(input).toBeDefined();
  });

  it('renders the distance input', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });
    const input = renderer!.root.findByProps({ testID: 'distance-input' });
    expect(input).toBeDefined();
  });

  it('renders the trip date field', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });
    const dateField = renderer!.root.findByProps({ testID: 'trip-date-field' });
    expect(dateField).toBeDefined();
  });

  it('renders the Save Changes button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });
    const saveBtn = renderer!.root.findByProps({ testID: 'save-trip-button' });
    expect(saveBtn).toBeDefined();
  });

  it('renders the Delete Trip button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });
    const deleteBtn = renderer!.root.findByProps({ testID: 'delete-trip-button' });
    expect(deleteBtn).toBeDefined();
  });

  it('renders the Mark as Completed toggle', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'mark-completed-toggle' });
    expect(toggle).toBeDefined();
  });

  it('renders the Mark as Completed label', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });
    const label = renderer!.root.findByProps({ testID: 'mark-completed-label' });
    expect(label.props.children).toBe('Mark as Completed');
  });

  it('shows loading indicator when trips are loading', async () => {
    setupMocks({ tripsLoading: true });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });
    const indicator = renderer!.root.findByProps({ testID: 'edit-trip-loading' });
    expect(indicator).toBeDefined();
  });

  it('shows loading state on Save Changes button when isSaving', async () => {
    setupMocks({ isSaving: true });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });
    const indicator = renderer!.root.findByProps({ testID: 'button-activity-indicator' });
    expect(indicator).toBeDefined();
  });

  it('shows delete loading indicator when isDeleting', async () => {
    setupMocks({ isDeleting: true });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });
    const indicator = renderer!.root.findByProps({ testID: 'delete-loading-indicator' });
    expect(indicator).toBeDefined();
  });

  it('renders the impact preview placeholder when no distance entered', async () => {
    setupMocks({ tripsData: { active: [], completed: [] } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });
    const placeholder = renderer!.root.findByProps({
      testID: 'trip-impact-preview-placeholder',
    });
    expect(placeholder).toBeDefined();
  });

  it('mark-completed toggle is off for an active trip', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'mark-completed-toggle' });
    expect(toggle.props.value).toBe(false);
  });

  it('mark-completed toggle is on for a completed trip', async () => {
    setupMocks({ tripsData: { active: [], completed: [mockTrip] } });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });
    const toggle = renderer!.root.findByProps({ testID: 'mark-completed-toggle' });
    // After useEffect fires with completed trip, toggle should be true
    expect(toggle.props.value).toBe(true);
  });

  it('calls mutate with correct data on valid submission', async () => {
    const mutate = jest.fn();
    setupMocks({ mutate });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });

    await ReactTestRenderer.act(() => {
      findTextInput(renderer!, 'trip-name-input').props.onChangeText('Updated trip');
    });

    await ReactTestRenderer.act(() => {
      findTextInput(renderer!, 'distance-input').props.onChangeText('300');
    });

    const saveBtn = renderer!.root.findByProps({ testID: 'save-trip-button' });
    await ReactTestRenderer.act(() => {
      saveBtn.props.onPress();
    });

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ estimated_miles: 300, name: 'Updated trip' }),
    );
  });

  it('does not call mutate when trip name is empty', async () => {
    const mutate = jest.fn();
    setupMocks({ mutate });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });

    await ReactTestRenderer.act(() => {
      findTextInput(renderer!, 'trip-name-input').props.onChangeText('');
    });

    await ReactTestRenderer.act(() => {
      findTextInput(renderer!, 'distance-input').props.onChangeText('300');
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
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });

    await ReactTestRenderer.act(() => {
      findTextInput(renderer!, 'trip-name-input').props.onChangeText('My Trip');
    });

    await ReactTestRenderer.act(() => {
      findTextInput(renderer!, 'distance-input').props.onChangeText('0');
    });

    const saveBtn = renderer!.root.findByProps({ testID: 'save-trip-button' });
    await ReactTestRenderer.act(() => {
      saveBtn.props.onPress();
    });

    expect(mutate).not.toHaveBeenCalled();
  });

  it('shows impact preview text when a valid distance is entered', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<EditTripScreen />);
    });

    await ReactTestRenderer.act(() => {
      findTextInput(renderer!, 'distance-input').props.onChangeText('500');
    });

    const previewText = renderer!.root.findByProps({ testID: 'trip-impact-preview-text' });
    expect(previewText).toBeDefined();
  });
});

