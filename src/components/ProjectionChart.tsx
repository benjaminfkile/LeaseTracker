import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../theme';
import type { Lease, LeaseSummary, MileageHistoryEntry } from '../types/api';

type ProjectionChartProps = {
  entries: MileageHistoryEntry[];
  mode: 'full-lease' | 'this-year';
  lease?: Lease;
  summary?: LeaseSummary;
  testID?: string;
};

function filterEntries(
  entries: MileageHistoryEntry[],
  mode: 'full-lease' | 'this-year',
): MileageHistoryEntry[] {
  if (mode === 'this-year') {
    const currentYear = new Date().getFullYear();
    return entries.filter(e => {
      const [year] = e.month.split('-');
      return Number(year) === currentYear;
    });
  }
  return entries;
}

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return `${d.toLocaleString('default', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`;
}

type ChartDataPoint = {
  value: number;
  label: string;
  dataPointText: string;
};

function buildCumulativeMiles(filtered: MileageHistoryEntry[]): number[] {
  const cumulative: number[] = [];
  let total = 0;
  for (const e of filtered) {
    total += e.miles_driven;
    cumulative.push(total);
  }
  return cumulative;
}

function buildCumulativeExpected(filtered: MileageHistoryEntry[]): number[] {
  const cumulative: number[] = [];
  let total = 0;
  for (const e of filtered) {
    total += e.expected_miles;
    cumulative.push(total);
  }
  return cumulative;
}

function buildActualData(filtered: MileageHistoryEntry[], cumulativeMiles: number[], hasProjection: boolean): ChartDataPoint[] {
  return filtered.map((e, i) => {
    let label = '';
    if (i === 0) {
      label = 'Start';
    } else if (hasProjection && i === filtered.length - 1) {
      label = 'Today';
    } else if (i % Math.ceil(filtered.length / 4) === 0) {
      label = formatMonthLabel(e.month);
    }
    return { value: cumulativeMiles[i], label, dataPointText: '' };
  });
}

export function ProjectionChart({
  entries,
  mode,
  lease,
  summary,
  testID,
}: ProjectionChartProps): React.ReactElement {
  const theme = useTheme();
  const filtered = filterEntries(entries, mode);

  if (filtered.length === 0) {
    return (
      <View
        style={[styles.empty, { borderColor: theme.colors.border }]}
        testID={testID ?? 'projection-chart'}
      >
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          {'No data available'}
        </Text>
      </View>
    );
  }

  const hasProjection = lease != null && summary != null && filtered.length > 0;
  const projectionColor = summary?.pace_status === 'ahead' ? theme.colors.error : theme.colors.success;

  const cumulativeMiles = buildCumulativeMiles(filtered);
  const cumulativeExpected = buildCumulativeExpected(filtered);

  const actualData = buildActualData(filtered, cumulativeMiles, hasProjection);
  const expectedData: ChartDataPoint[] = filtered.map((_e, i) => ({
    value: cumulativeExpected[i],
    label: '',
    dataPointText: '',
  }));

  let projectedData: ChartDataPoint[] | undefined;
  if (hasProjection && summary != null && lease != null) {
    const totalMiles = lease.total_miles_allowed;
    const projectedMiles = summary.projected_miles_at_end;
    const lastMileage = cumulativeMiles[cumulativeMiles.length - 1];
    // Extend actual and expected to the lease-end "End" marker
    actualData.push({ value: lastMileage, label: 'End', dataPointText: '' });
    expectedData.push({ value: totalMiles, label: '', dataPointText: '' });
    // Projected series: reuse actual values for historical points, then diverges to projected end
    projectedData = [
      ...actualData.slice(0, filtered.length).map(p => ({ ...p, label: '' })),
      { value: projectedMiles, label: '', dataPointText: '' },
    ];
  }

  return (
    <View style={styles.container} testID={testID ?? 'projection-chart'}>
      <LineChart
        data={actualData}
        data2={expectedData}
        data3={projectedData}
        color1={theme.colors.primary}
        color2={theme.colors.warning}
        color3={projectionColor}
        thickness={2}
        hideDataPoints
        areaChart
        startFillColor1={theme.colors.primary}
        startFillColor2={theme.colors.warning}
        startOpacity1={0.15}
        startOpacity2={0.1}
        endOpacity1={0.01}
        endOpacity2={0.01}
        xAxisLabelTextStyle={{ color: theme.colors.textSecondary, fontSize: 10 }}
        yAxisTextStyle={{ color: theme.colors.textSecondary, fontSize: 10 }}
        yAxisColor={theme.colors.border}
        xAxisColor={theme.colors.border}
        rulesColor={theme.colors.border}
        backgroundColor={theme.colors.surface}
        curved
        isAnimated
        width={300}
        height={180}
        noOfSections={4}
      />
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
          <Text style={[styles.legendLabel, { color: theme.colors.textSecondary }]}>
            {'Actual'}
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.warning }]} />
          <Text style={[styles.legendLabel, { color: theme.colors.textSecondary }]}>
            {'Expected'}
          </Text>
        </View>
        {hasProjection && (
          <View style={styles.legendItem} testID="projection-legend-item">
            <View style={[styles.legendDot, { backgroundColor: projectionColor }]} />
            <Text style={[styles.legendLabel, { color: theme.colors.textSecondary }]}>
              {'Projected'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  empty: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 120,
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  emptyText: {
    fontSize: 14,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendDot: {
    borderRadius: 4,
    height: 8,
    marginRight: 4,
    width: 8,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    marginHorizontal: 12,
  },
  legendLabel: {
    fontSize: 12,
  },
});
