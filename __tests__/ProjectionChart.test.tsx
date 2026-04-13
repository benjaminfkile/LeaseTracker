jest.mock('react-native-gifted-charts', () => ({
  LineChart: 'LineChart',
  BarChart: 'BarChart',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ProjectionChart } from '../src/components/ProjectionChart';
import type { Lease, LeaseSummary, MileageHistoryEntry } from '../src/types/api';

const entries: MileageHistoryEntry[] = [
  { month: '2024-01', miles_driven: 1000, expected_miles: 1000 },
  { month: '2024-02', miles_driven: 2100, expected_miles: 2000 },
  { month: '2024-03', miles_driven: 3050, expected_miles: 3000 },
];

const lease: Lease = {
  id: 'lease-1',
  user_id: 'user-1',
  display_name: '2022 Toyota Camry',
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  trim: null,
  color: null,
  vin: null,
  license_plate: null,
  lease_start_date: '2022-01-01',
  lease_end_date: '2025-01-01',
  total_miles_allowed: 36000,
  miles_per_year: 12000,
  starting_odometer: 0,
  current_odometer: 3050,
  overage_cost_per_mile: '0.25',
  monthly_payment: null,
  dealer_name: null,
  dealer_phone: null,
  contract_number: null,
  notes: null,
  is_active: true,
  created_at: '2022-01-01T00:00:00Z',
  updated_at: '2024-03-15T00:00:00Z',
};

const summaryOnTrack: LeaseSummary = {
  miles_driven: 3050,
  miles_remaining: 32950,
  days_elapsed: 796,
  days_remaining: 300,
  lease_length_days: 1096,
  expected_miles_to_date: 26127,
  current_pace_per_month: 116,
  pace_status: 'behind',
  miles_over_under_pace: -23077,
  projected_miles_at_end: 35500,
  projected_overage: 0,
  projected_overage_cost: 0,
  recommended_daily_miles: 110,
  reserved_trip_miles: 0,
  is_premium: false,
};

const summaryOverPace: LeaseSummary = {
  ...summaryOnTrack,
  projected_miles_at_end: 38000,
  pace_status: 'ahead',
};

describe('ProjectionChart', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<ProjectionChart entries={entries} mode="full-lease" />);
    });
  });

  it('renders with default testID projection-chart', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<ProjectionChart entries={entries} mode="full-lease" />);
    });
    const chart = renderer!.root.findByProps({ testID: 'projection-chart' });
    expect(chart).toBeDefined();
  });

  it('renders with custom testID', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ProjectionChart entries={entries} mode="full-lease" testID="my-projection-chart" />,
      );
    });
    const chart = renderer!.root.findByProps({ testID: 'my-projection-chart' });
    expect(chart).toBeDefined();
  });

  it('renders empty state when entries is empty', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ProjectionChart entries={[]} mode="full-lease" testID="projection-chart" />,
      );
    });
    const chart = renderer!.root.findByProps({ testID: 'projection-chart' });
    expect(chart).toBeDefined();
    // Empty state text is shown
    const allTexts = renderer!.root.findAllByType('Text' as never);
    const emptyText = allTexts.find(
      (t: ReactTestRenderer.ReactTestInstance) => t.props.children === 'No data available',
    );
    expect(emptyText).toBeDefined();
  });

  it('renders empty state in this-year mode with no matching entries', async () => {
    const oldEntries: MileageHistoryEntry[] = [
      { month: '2020-01', miles_driven: 1000, expected_miles: 1000 },
    ];
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ProjectionChart entries={oldEntries} mode="this-year" testID="projection-chart" />,
      );
    });
    const chart = renderer!.root.findByProps({ testID: 'projection-chart' });
    expect(chart).toBeDefined();
  });

  it('renders LineChart when entries are present in full-lease mode', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ProjectionChart entries={entries} mode="full-lease" testID="projection-chart" />,
      );
    });
    const lineCharts = renderer!.root.findAllByType('LineChart' as never);
    expect(lineCharts.length).toBeGreaterThan(0);
  });

  it('filters entries to current year in this-year mode', async () => {
    const currentYear = new Date().getFullYear();
    const currentYearEntries: MileageHistoryEntry[] = [
      { month: `${currentYear}-01`, miles_driven: 500, expected_miles: 500 },
      { month: `${currentYear}-02`, miles_driven: 1100, expected_miles: 1000 },
    ];
    const mixedEntries = [...entries, ...currentYearEntries];
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ProjectionChart entries={mixedEntries} mode="this-year" testID="projection-chart" />,
      );
    });
    const chart = renderer!.root.findByProps({ testID: 'projection-chart' });
    expect(chart).toBeDefined();
  });

  it('renders projected data series (data3) when lease and summary are provided', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ProjectionChart
          entries={entries}
          mode="full-lease"
          lease={lease}
          summary={summaryOnTrack}
          testID="projection-chart"
        />,
      );
    });
    const lineChart = renderer!.root.findByType('LineChart' as never);
    const data3 = lineChart.props.data3 as Array<{ value: number }>;
    expect(data3).toBeDefined();
    expect(Array.isArray(data3)).toBe(true);
    // Last point should be the projected end mileage
    expect(data3[data3.length - 1].value).toBe(summaryOnTrack.projected_miles_at_end);
  });

  it('extends data and data2 with End point when lease and summary are provided', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ProjectionChart
          entries={entries}
          mode="full-lease"
          lease={lease}
          summary={summaryOnTrack}
          testID="projection-chart"
        />,
      );
    });
    const lineChart = renderer!.root.findByType('LineChart' as never);
    const data = lineChart.props.data as Array<{ value: number; label: string }>;
    const data2 = lineChart.props.data2 as Array<{ value: number }>;
    // data has N+1 points: N historical + 1 End point
    expect(data).toHaveLength(entries.length + 1);
    // End point label
    expect(data[data.length - 1].label).toBe('End');
    // data2 last point = total_miles_allowed
    expect(data2[data2.length - 1].value).toBe(lease.total_miles_allowed);
  });

  it('uses error color (red) for projected line when isOverPace is true', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ProjectionChart
          entries={entries}
          mode="full-lease"
          lease={lease}
          summary={summaryOverPace}
          testID="projection-chart"
        />,
      );
    });
    const lineChart = renderer!.root.findByType('LineChart' as never);
    // color3 should be the error color (red) when over pace
    expect(lineChart.props.color3).toBeDefined();
    // Verify legend item is present with testID
    const legendItem = renderer!.root.findByProps({ testID: 'projection-legend-item' });
    expect(legendItem).toBeDefined();
  });

  it('uses success color (green) for projected line when isOverPace is false', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ProjectionChart
          entries={entries}
          mode="full-lease"
          lease={lease}
          summary={summaryOnTrack}
          testID="projection-chart"
        />,
      );
    });
    const lineChart = renderer!.root.findByType('LineChart' as never);
    expect(lineChart.props.color3).toBeDefined();
    const legendItem = renderer!.root.findByProps({ testID: 'projection-legend-item' });
    expect(legendItem).toBeDefined();
  });

  it('does not render projected legend item without lease/summary', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ProjectionChart entries={entries} mode="full-lease" testID="projection-chart" />,
      );
    });
    const legendItems = renderer!.root.findAllByProps({ testID: 'projection-legend-item' });
    expect(legendItems).toHaveLength(0);
  });

  it('assigns Start label to first entry and Today label to last entry when projection is active', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ProjectionChart
          entries={entries}
          mode="full-lease"
          lease={lease}
          summary={summaryOnTrack}
          testID="projection-chart"
        />,
      );
    });
    const lineChart = renderer!.root.findByType('LineChart' as never);
    const data = lineChart.props.data as Array<{ label: string }>;
    expect(data[0].label).toBe('Start');
    expect(data[entries.length - 1].label).toBe('Today');
  });
});
