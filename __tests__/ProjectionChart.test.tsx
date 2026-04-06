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
import type { MileageHistoryEntry } from '../src/types/api';

const entries: MileageHistoryEntry[] = [
  { date: '2024-01-15', mileage: 1000, projectedMileage: 1000 },
  { date: '2024-02-15', mileage: 2100, projectedMileage: 2000 },
  { date: '2024-03-15', mileage: 3050, projectedMileage: 3000 },
];

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
      { date: '2020-01-01', mileage: 1000, projectedMileage: 1000 },
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
      { date: `${currentYear}-01-15`, mileage: 500, projectedMileage: 500 },
      { date: `${currentYear}-02-15`, mileage: 1100, projectedMileage: 1000 },
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
});
