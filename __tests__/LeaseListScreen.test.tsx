jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Swipeable: ({
      children,
      renderRightActions,
      testID,
    }: {
      children?: React.ReactNode;
      renderRightActions?: () => React.ReactNode;
      testID?: string;
    }) =>
      React.createElement(
        View,
        { testID },
        children,
        renderRightActions != null ? renderRightActions() : null,
      ),
    GestureHandlerRootView: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, {}, children),
  };
});

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
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(() => ({ invalidateQueries: jest.fn() })),
}));

jest.mock('../src/api/leaseApi', () => ({
  getLeases: jest.fn(),
  deleteLease: jest.fn(),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useQuery, useMutation } from '@tanstack/react-query';
import { LeaseListScreen } from '../src/screens/leases/LeaseListScreen';
import type { Lease } from '../src/types/api';

const mockUseQuery = useQuery as jest.Mock;
const mockUseMutation = useMutation as jest.Mock;

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

function setupMocks({
  leases = [mockLease],
  isLoading = false,
  error = null,
}: {
  leases?: Lease[];
  isLoading?: boolean;
  error?: Error | null;
} = {}) {
  mockUseQuery.mockReturnValue({ data: leases, isLoading, error, refetch: jest.fn() });
  mockUseMutation.mockReturnValue({ mutate: jest.fn() });
}

describe('LeaseListScreen', () => {
  beforeEach(() => {
    setupMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<LeaseListScreen />);
    });
  });

  it('renders with testID lease-list-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseListScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'lease-list-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the screen header with title My Leases', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseListScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'screen-header-title' });
    expect(title.props.children).toBe('My Leases');
  });

  it('renders the add (+) button in the header', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseListScreen />);
    });
    const btn = renderer!.root.findByProps({ testID: 'lease-list-add-button' });
    expect(btn).toBeDefined();
  });

  it('shows a loading indicator when leases are loading', async () => {
    setupMocks({ leases: [], isLoading: true });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseListScreen />);
    });
    const loading = renderer!.root.findByProps({ testID: 'lease-list-loading' });
    expect(loading).toBeDefined();
  });

  it('shows an error message when leases fail to load', async () => {
    setupMocks({ leases: [], error: new Error('Network error') });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseListScreen />);
    });
    const errorEl = renderer!.root.findByProps({ testID: 'error-message' });
    expect(errorEl).toBeDefined();
  });

  it('shows empty state when there are no leases', async () => {
    setupMocks({ leases: [] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseListScreen />);
    });
    const emptyTitle = renderer!.root.findByProps({ testID: 'empty-state-title' });
    expect(emptyTitle.props.children).toBe('No leases yet. Add your first lease →');
  });

  it('renders the FlatList when leases are available', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseListScreen />);
    });
    const list = renderer!.root.findByProps({ testID: 'lease-list-flat-list' });
    expect(list).toBeDefined();
  });

  it('renders a LeaseCard for each lease', async () => {
    const secondLease: Lease = { ...mockLease, id: 'lease-2', vehicleModel: 'Corolla' };
    setupMocks({ leases: [mockLease, secondLease] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<LeaseListScreen />);
    });
    const labels = renderer!.root.findAllByProps({ testID: 'lease-card-vehicle-label' });
    expect(labels.length).toBeGreaterThanOrEqual(2);
  });
});
