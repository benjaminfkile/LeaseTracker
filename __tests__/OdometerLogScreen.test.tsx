jest.mock('react-native-safe-area-context', () => {
  const MockView = require('react-native').View;
  const MockReact = require('react');
  return {
    useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
    SafeAreaView: ({ children }: { children?: React.ReactNode }) =>
      MockReact.createElement(MockView, {}, children),
    SafeAreaProvider: ({ children }: { children?: React.ReactNode }) =>
      MockReact.createElement(MockView, {}, children),
  };
});

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

jest.mock('../src/api/readingsApi', () => ({
  getReadings: jest.fn(),
  deleteReading: jest.fn(),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useQuery, useMutation } from '@tanstack/react-query';
import { OdometerLogScreen, buildSections } from '../src/screens/home/OdometerLogScreen';
import type { OdometerReading } from '../src/types/api';

const mockUseQuery = useQuery as jest.Mock;
const mockUseMutation = useMutation as jest.Mock;

const mockReading1: OdometerReading = {
  id: 'reading-1',
  leaseId: 'lease-1',
  mileage: 10000,
  readingDate: '2026-03-01',
  createdAt: '2026-03-01T00:00:00Z',
};

const mockReading2: OdometerReading = {
  id: 'reading-2',
  leaseId: 'lease-1',
  mileage: 10500,
  readingDate: '2026-03-15',
  createdAt: '2026-03-15T00:00:00Z',
};

const mockReading3: OdometerReading = {
  id: 'reading-3',
  leaseId: 'lease-1',
  mileage: 11200,
  readingDate: '2026-04-01',
  createdAt: '2026-04-01T00:00:00Z',
};

function setupMocks({
  readings = [mockReading1, mockReading2, mockReading3],
  isLoading = false,
  error = null,
}: {
  readings?: OdometerReading[];
  isLoading?: boolean;
  error?: Error | null;
} = {}) {
  mockUseQuery.mockReturnValue({ data: readings, isLoading, error, refetch: jest.fn() });
  mockUseMutation.mockReturnValue({ mutate: jest.fn() });
}

describe('OdometerLogScreen', () => {
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
      ReactTestRenderer.create(<OdometerLogScreen />);
    });
  });

  it('renders with testID odometer-log-screen', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OdometerLogScreen />);
    });
    const screen = renderer!.root.findByProps({ testID: 'odometer-log-screen' });
    expect(screen).toBeDefined();
  });

  it('renders the screen header with title Odometer Log', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OdometerLogScreen />);
    });
    const title = renderer!.root.findByProps({ testID: 'screen-header-title' });
    expect(title.props.children).toBe('Odometer Log');
  });

  it('renders the back button in the header', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OdometerLogScreen />);
    });
    const backBtn = renderer!.root.findByProps({ testID: 'screen-header-back-button' });
    expect(backBtn).toBeDefined();
  });

  it('shows a loading indicator when readings are loading', async () => {
    setupMocks({ isLoading: true, readings: [] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OdometerLogScreen />);
    });
    const loading = renderer!.root.findByProps({ testID: 'odometer-log-loading' });
    expect(loading).toBeDefined();
  });

  it('shows an error message when readings fail to load', async () => {
    setupMocks({ error: new Error('Network error'), readings: [] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OdometerLogScreen />);
    });
    const errorEl = renderer!.root.findByProps({ testID: 'error-message' });
    expect(errorEl).toBeDefined();
  });

  it('shows empty state when there are no readings', async () => {
    setupMocks({ readings: [] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OdometerLogScreen />);
    });
    const emptyTitle = renderer!.root.findByProps({ testID: 'empty-state-title' });
    expect(emptyTitle.props.children).toBe('No readings yet');
  });

  it('shows empty state subtitle', async () => {
    setupMocks({ readings: [] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OdometerLogScreen />);
    });
    const subtitle = renderer!.root.findByProps({ testID: 'empty-state-subtitle' });
    expect(subtitle).toBeDefined();
  });

  it('renders the SectionList when readings are available', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OdometerLogScreen />);
    });
    const list = renderer!.root.findByProps({ testID: 'odometer-log-list' });
    expect(list).toBeDefined();
  });

  it('renders the FAB when readings are available', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OdometerLogScreen />);
    });
    const fab = renderer!.root.findByProps({ testID: 'odometer-log-fab' });
    expect(fab).toBeDefined();
  });

  it('renders the FAB on empty state as well', async () => {
    setupMocks({ readings: [] });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OdometerLogScreen />);
    });
    const fab = renderer!.root.findByProps({ testID: 'odometer-log-fab' });
    expect(fab).toBeDefined();
  });

  it('renders section headers grouped by month', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OdometerLogScreen />);
    });
    const marchHeader = renderer!.root.findByProps({ testID: 'section-header-March 2026' });
    expect(marchHeader).toBeDefined();
    const aprilHeader = renderer!.root.findByProps({ testID: 'section-header-April 2026' });
    expect(aprilHeader).toBeDefined();
  });

  it('renders reading rows for each reading', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OdometerLogScreen />);
    });
    const row1 = renderer!.root.findByProps({ testID: 'reading-row-reading-1' });
    expect(row1).toBeDefined();
    const row2 = renderer!.root.findByProps({ testID: 'reading-row-reading-2' });
    expect(row2).toBeDefined();
    const row3 = renderer!.root.findByProps({ testID: 'reading-row-reading-3' });
    expect(row3).toBeDefined();
  });

  it('renders the mileage for each reading', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OdometerLogScreen />);
    });
    const mileage1 = renderer!.root.findByProps({ testID: 'reading-mileage-reading-1' });
    expect(mileage1.props.children).toBe('10,000 mi');
  });

  it('renders the date for each reading', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OdometerLogScreen />);
    });
    const date1 = renderer!.root.findByProps({ testID: 'reading-date-reading-1' });
    expect(date1).toBeDefined();
  });

  it('does not render delta for the first (oldest) reading', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OdometerLogScreen />);
    });
    const deltas = renderer!.root.findAllByProps({ testID: 'reading-delta-reading-1' });
    expect(deltas).toHaveLength(0);
  });

  it('renders the delta for subsequent readings', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OdometerLogScreen />);
    });
    const delta2 = renderer!.root.findByProps({ testID: 'reading-delta-reading-2' });
    expect(delta2).toBeDefined();
  });

  it('renders a source badge for each reading', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OdometerLogScreen />);
    });
    const source = renderer!.root.findByProps({ testID: 'reading-source-reading-1' });
    expect(source).toBeDefined();
  });

  it('exposes delete action via swipe for each reading', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<OdometerLogScreen />);
    });
    const deleteAction = renderer!.root.findByProps({
      testID: 'reading-delete-action-reading-1',
    });
    expect(deleteAction).toBeDefined();
  });
});

describe('buildSections', () => {
  it('returns an empty array for no readings', () => {
    expect(buildSections([])).toEqual([]);
  });

  it('groups readings into sections by month', () => {
    const sections = buildSections([mockReading1, mockReading2, mockReading3]);
    expect(sections).toHaveLength(2);
  });

  it('orders sections with newest month first', () => {
    const sections = buildSections([mockReading1, mockReading2, mockReading3]);
    expect(sections[0].monthKey).toBe('April 2026');
    expect(sections[1].monthKey).toBe('March 2026');
  });

  it('orders readings within a section with newest first', () => {
    const sections = buildSections([mockReading1, mockReading2, mockReading3]);
    const marchSection = sections.find(s => s.monthKey === 'March 2026')!;
    expect(marchSection.data[0].id).toBe('reading-2');
    expect(marchSection.data[1].id).toBe('reading-1');
  });

  it('sets delta to null for the oldest reading', () => {
    const sections = buildSections([mockReading1, mockReading2, mockReading3]);
    const marchSection = sections.find(s => s.monthKey === 'March 2026')!;
    const oldest = marchSection.data[marchSection.data.length - 1];
    expect(oldest.delta).toBeNull();
  });

  it('computes delta correctly across months', () => {
    const sections = buildSections([mockReading1, mockReading2, mockReading3]);
    const aprilSection = sections.find(s => s.monthKey === 'April 2026')!;
    expect(aprilSection.data[0].delta).toBe(700);
  });

  it('computes miles driven in section title', () => {
    const sections = buildSections([mockReading1, mockReading2, mockReading3]);
    const marchSection = sections.find(s => s.monthKey === 'March 2026')!;
    expect(marchSection.title).toContain('500');
  });

  it('includes month key in section', () => {
    const sections = buildSections([mockReading1]);
    expect(sections[0].monthKey).toBe('March 2026');
  });

  it('shows just month year when miles driven is zero (no delta)', () => {
    const sections = buildSections([mockReading1]);
    expect(sections[0].title).toBe('March 2026');
  });
});
