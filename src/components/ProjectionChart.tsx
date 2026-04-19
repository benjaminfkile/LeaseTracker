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
    const currentYear = String(new Date().getFullYear());
    return entries.filter(e => e.month.startsWith(currentYear));
  }
  return entries;
}

function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return `${d.toLocaleString('default', { month: 'short' })} '${year.slice(2)}`;
}

type ChartDataPoint = {
  value: number;
  label: string;
  dataPointText: string;
};

function buildActualData(filtered: MileageHistoryEntry[], hasProjection: boolean): ChartDataPoint[] {
  return filtered.map((e, i) => {
    let label = '';
    if (i === 0) {
      label = 'Start';
    } else if (hasProjection && i === filtered.length - 1) {
      label = 'Today';
    } else if (i % Math.ceil(filtered.length / 4) === 0) {
      label = formatMonthLabel(e.month);
    }
    return { value: e.miles_driven, label, dataPointText: '' };
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
  const projectionColor =
    summary?.pace_status === 'ahead' ? theme.colors.error : theme.colors.success;

  const actualData = buildActualData(filtered, hasProjection);
  const expectedData: ChartDataPoint[] = filtered.map(e => ({
    value: e.expected_miles,
    label: '',
    dataPointText: '',
  }));

  let projectedData: ChartDataPoint[] | undefined;
  if (hasProjection && summary != null && lease != null) {
    const totalMiles = lease.total_miles_allowed;
    const projectedMiles = summary.projected_miles_at_end;
    const lastMileage = filtered[filtered.length - 1].miles_driven;
    actualData.push({ value: lastMileage, label: 'End', dataPointText: '' });
    expectedData.push({ value: totalMiles, label: '', dataPointText: '' });
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
