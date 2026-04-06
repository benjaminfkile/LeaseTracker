jest.mock('react-native-gifted-charts', () => ({
  LineChart: 'LineChart',
  BarChart: 'BarChart',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { MonthlyMileageChart, computeMonthlyBars } from '../src/components/MonthlyMileageChart';
import type { MileageHistoryEntry } from '../src/types/api';

const entries: MileageHistoryEntry[] = [
  { date: '2024-01-31', mileage: 1000, projectedMileage: 1000 },
  { date: '2024-02-29', mileage: 2100, projectedMileage: 2000 },
  { date: '2024-03-31', mileage: 3050, projectedMileage: 3000 },
];

describe('MonthlyMileageChart', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(<MonthlyMileageChart entries={entries} mode="full-lease" />);
    });
  });

  it('renders with default testID monthly-mileage-chart', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <MonthlyMileageChart entries={entries} mode="full-lease" />,
      );
    });
    const chart = renderer!.root.findByProps({ testID: 'monthly-mileage-chart' });
    expect(chart).toBeDefined();
  });

  it('renders with custom testID', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <MonthlyMileageChart entries={entries} mode="full-lease" testID="my-bar-chart" />,
      );
    });
    const chart = renderer!.root.findByProps({ testID: 'my-bar-chart' });
    expect(chart).toBeDefined();
  });

  it('renders empty state when entries is empty', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <MonthlyMileageChart entries={[]} mode="full-lease" testID="monthly-mileage-chart" />,
      );
    });
    const chart = renderer!.root.findByProps({ testID: 'monthly-mileage-chart' });
    expect(chart).toBeDefined();
    const allTexts = renderer!.root.findAllByType('Text' as never);
    const emptyText = allTexts.find(
      (t: ReactTestRenderer.ReactTestInstance) => t.props.children === 'No data available',
    );
    expect(emptyText).toBeDefined();
  });

  it('renders BarChart when entries are present', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <MonthlyMileageChart entries={entries} mode="full-lease" testID="monthly-mileage-chart" />,
      );
    });
    const barCharts = renderer!.root.findAllByType('BarChart' as never);
    expect(barCharts.length).toBeGreaterThan(0);
  });

  it('renders empty state in this-year mode with no matching entries', async () => {
    const oldEntries: MileageHistoryEntry[] = [
      { date: '2020-06-01', mileage: 5000, projectedMileage: 5000 },
    ];
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <MonthlyMileageChart entries={oldEntries} mode="this-year" testID="monthly-mileage-chart" />,
      );
    });
    const chart = renderer!.root.findByProps({ testID: 'monthly-mileage-chart' });
    expect(chart).toBeDefined();
  });

  it('does not render legend when monthlyAllowance is not provided', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <MonthlyMileageChart entries={entries} mode="full-lease" />,
      );
    });
    const legends = renderer!.root.findAllByProps({ testID: 'monthly-chart-legend' });
    expect(legends).toHaveLength(0);
  });

  it('renders legend with Monthly Allowance item when monthlyAllowance is provided', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <MonthlyMileageChart entries={entries} mode="full-lease" monthlyAllowance={1000} />,
      );
    });
    const legend = renderer!.root.findByProps({ testID: 'monthly-chart-legend' });
    expect(legend).toBeDefined();
    const allowanceLegend = renderer!.root.findByProps({ testID: 'monthly-allowance-legend-item' });
    expect(allowanceLegend).toBeDefined();
  });

  it('passes showReferenceLine1 and referenceLine1Position to BarChart when monthlyAllowance is provided', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <MonthlyMileageChart entries={entries} mode="full-lease" monthlyAllowance={1200} />,
      );
    });
    const barChart = renderer!.root.findByType('BarChart' as never);
    expect(barChart.props.showReferenceLine1).toBe(true);
    expect(barChart.props.referenceLine1Position).toBe(1200);
  });

  it('does not show threshold reference line when monthlyAllowance is 0', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <MonthlyMileageChart entries={entries} mode="full-lease" monthlyAllowance={0} />,
      );
    });
    const barChart = renderer!.root.findByType('BarChart' as never);
    expect(barChart.props.showReferenceLine1).toBe(false);
    const legends = renderer!.root.findAllByProps({ testID: 'monthly-chart-legend' });
    expect(legends).toHaveLength(0);
  });
});

describe('computeMonthlyBars', () => {
  const primaryColor = '#4F6AF5';

  it('returns empty array for empty entries', () => {
    const bars = computeMonthlyBars([], 'full-lease', primaryColor);
    expect(bars).toHaveLength(0);
  });

  it('returns a bar for each unique month', () => {
    const bars = computeMonthlyBars(entries, 'full-lease', primaryColor);
    expect(bars).toHaveLength(3);
  });

  it('first bar value equals the first month mileage from zero baseline', () => {
    const bars = computeMonthlyBars(entries, 'full-lease', primaryColor);
    // First bar: baseline is 0 (start of lease), so value = 1000 - 0 = 1000
    expect(bars[0].value).toBe(1000);
  });

  it('computes delta between consecutive months', () => {
    const bars = computeMonthlyBars(entries, 'full-lease', primaryColor);
    // Second bar: 2100 - 1000 = 1100
    expect(bars[1].value).toBe(1100);
    // Third bar: 3050 - 2100 = 950
    expect(bars[2].value).toBe(950);
  });

  it('uses the provided primary color', () => {
    const bars = computeMonthlyBars(entries, 'full-lease', '#FF0000');
    bars.forEach(bar => expect(bar.frontColor).toBe('#FF0000'));
  });

  it('filters by current year in this-year mode', () => {
    const currentYear = new Date().getFullYear();
    const mixedEntries: MileageHistoryEntry[] = [
      { date: '2020-01-01', mileage: 500, projectedMileage: 500 },
      { date: `${currentYear}-03-01`, mileage: 3000, projectedMileage: 3000 },
      { date: `${currentYear}-04-01`, mileage: 4100, projectedMileage: 4000 },
    ];
    const bars = computeMonthlyBars(mixedEntries, 'this-year', primaryColor);
    expect(bars).toHaveLength(2);
  });

  it('returns all months in full-lease mode', () => {
    const currentYear = new Date().getFullYear();
    const mixedEntries: MileageHistoryEntry[] = [
      { date: '2020-01-01', mileage: 500, projectedMileage: 500 },
      { date: `${currentYear}-03-01`, mileage: 3000, projectedMileage: 3000 },
    ];
    const bars = computeMonthlyBars(mixedEntries, 'full-lease', primaryColor);
    expect(bars).toHaveLength(2);
  });

  it('does not produce negative bar values', () => {
    // mileage decreasing (shouldn't happen in practice but clamps to 0)
    const weirdEntries: MileageHistoryEntry[] = [
      { date: '2024-01-01', mileage: 2000, projectedMileage: 2000 },
      { date: '2024-02-01', mileage: 1500, projectedMileage: 2500 },
    ];
    const bars = computeMonthlyBars(weirdEntries, 'full-lease', primaryColor);
    bars.forEach(bar => expect(bar.value).toBeGreaterThanOrEqual(0));
  });

  it('generates month labels', () => {
    const bars = computeMonthlyBars(entries, 'full-lease', primaryColor);
    expect(bars[0].label).toBeTruthy();
    expect(bars[1].label).toBeTruthy();
    expect(bars[2].label).toBeTruthy();
  });
});
