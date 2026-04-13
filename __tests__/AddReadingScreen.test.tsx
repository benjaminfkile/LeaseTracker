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
    params: { leaseId: 'lease-1' },
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(() => ({ invalidateQueries: jest.fn() })),
}));

jest.mock('../src/api/leaseApi', () => ({
  getLease: jest.fn(),
}));

jest.mock('../src/api/readingsApi', () => ({
  addReading: jest.fn(),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AddReadingScreen } from '../src/screens/home/AddReadingScreen';
import type { Lease } from '../src/types/api';

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
  startingMileage: 0,
  currentMileage: 12000,
  monthlyMiles: 1000,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

function setupMocks({
  lease = mockLease,
  isLoading = false,
  mutate = jest.fn(),
  isPending = false,
}: {
  lease?: Lease | undefined;
  isLoading?: boolean;
  mutate?: jest.Mock;
  isPending?: boolean;
} = {}) {
  mockUseQuery.mockReturnValue({ data: lease, isLoading });
  mockUseMutation.mockReturnValue({ mutate, isPending });
}

describe('AddReadingScreen', () => {
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
      ReactTestRenderer.create(<AddReadingScreen />);
    });
  });

  it('renders with testID add-reading-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'add-reading-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the Add Reading title text', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'add-reading-title' });
    expect(title).toBeDefined();
  });

  it('renders the screen header with title Add Reading', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });
    const header = renderer!.root.findByProps({ testID: 'screen-header-title' });
    expect(header.props.children).toBe('Add Reading');
  });

  it('renders the back button in the header', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });
    const backBtn = renderer!.root.findByProps({ testID: 'screen-header-back-button' });
    expect(backBtn).toBeDefined();
  });

  it('renders the OdometerInput', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });
    const input = renderer!.root.findByProps({ testID: 'odometer-input' });
    expect(input).toBeDefined();
  });

  it('renders the odometer TextInput', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });
    const textInput = renderer!.root.findByProps({ testID: 'odometer-text-input' });
    expect(textInput).toBeDefined();
  });

  it('renders the Use Camera (OCR) button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });
    const cameraBtn = renderer!.root.findByProps({ testID: 'use-camera-button' });
    expect(cameraBtn).toBeDefined();
  });

  it('renders the reading date field', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });
    const dateField = renderer!.root.findByProps({ testID: 'reading-date-field' });
    expect(dateField).toBeDefined();
  });

  it('renders the reading date button defaulting to today', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });
    const dateBtn = renderer!.root.findByProps({ testID: 'reading-date-field-button' });
    expect(dateBtn).toBeDefined();
  });

  it('renders the notes input', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });
    const notesInput = renderer!.root.findByProps({ testID: 'notes-input' });
    expect(notesInput).toBeDefined();
  });

  it('renders the ReadingImpactCard', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });
    const card = renderer!.root.findByProps({ testID: 'reading-impact-card' });
    expect(card).toBeDefined();
  });

  it('renders the ReadingImpactCard title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });
    const cardTitle = renderer!.root.findByProps({ testID: 'reading-impact-title' });
    expect(cardTitle).toBeDefined();
  });

  it('shows placeholder in ReadingImpactCard when no mileage is entered', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });
    const placeholder = renderer!.root.findByProps({ testID: 'reading-impact-placeholder' });
    expect(placeholder).toBeDefined();
  });

  it('renders the Save Reading button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });
    const saveBtn = renderer!.root.findByProps({ testID: 'save-reading-button' });
    expect(saveBtn).toBeDefined();
  });

  it('shows loading state on Save Reading button when isPending', async () => {
    setupMocks({ isPending: true });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });
    const indicator = renderer!.root.findByProps({ testID: 'button-activity-indicator' });
    expect(indicator).toBeDefined();
  });

  it('shows odometer input error when mileage is below current odometer after submit', async () => {
    const mutate = jest.fn();
    setupMocks({ mutate });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });

    // Type a mileage below current (currentMileage = 12000, type 5000)
    const textInput = renderer!.root.findByProps({ testID: 'odometer-text-input' });
    await ReactTestRenderer.act(() => {
      textInput.props.onChangeText('5000');
    });

    // Submit
    const saveBtn = renderer!.root.findByProps({ testID: 'save-reading-button' });
    await ReactTestRenderer.act(() => {
      saveBtn.props.onPress();
    });

    const errorEl = renderer!.root.findByProps({ testID: 'odometer-input-error' });
    expect(errorEl).toBeDefined();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('calls mutate with correct data when mileage is valid', async () => {
    const mutate = jest.fn();
    setupMocks({ mutate });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });

    // Type a valid mileage (above 12000)
    const textInput = renderer!.root.findByProps({ testID: 'odometer-text-input' });
    await ReactTestRenderer.act(() => {
      textInput.props.onChangeText('13000');
    });

    // Submit
    const saveBtn = renderer!.root.findByProps({ testID: 'save-reading-button' });
    await ReactTestRenderer.act(() => {
      saveBtn.props.onPress();
    });

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ odometer: 13000 }),
    );
  });

  it('shows reading impact stats when a valid mileage is entered', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });

    const textInput = renderer!.root.findByProps({ testID: 'odometer-text-input' });
    await ReactTestRenderer.act(() => {
      textInput.props.onChangeText('13000');
    });

    const stats = renderer!.root.findByProps({ testID: 'reading-impact-stats' });
    expect(stats).toBeDefined();
  });

  it('shows miles added in impact card for a valid mileage', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });

    const textInput = renderer!.root.findByProps({ testID: 'odometer-text-input' });
    await ReactTestRenderer.act(() => {
      textInput.props.onChangeText('13000');
    });

    const milesAdded = renderer!.root.findByProps({ testID: 'reading-impact-miles-added' });
    expect(milesAdded.props.children).toBe('+1,000 mi');
  });

  it('does not show impact stats when mileage equals current odometer', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<AddReadingScreen />);
    });

    const textInput = renderer!.root.findByProps({ testID: 'odometer-text-input' });
    await ReactTestRenderer.act(() => {
      textInput.props.onChangeText('12000');
    });

    const placeholders = renderer!.root.findAllByProps({ testID: 'reading-impact-placeholder' });
    expect(placeholders.length).toBeGreaterThan(0);
  });
});

