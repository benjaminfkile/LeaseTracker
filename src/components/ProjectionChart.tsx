import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../theme';
import type { MileageHistoryEntry } from '../types/api';

type ProjectionChartProps = {
  entries: MileageHistoryEntry[];
  mode: 'full-lease' | 'this-year';
  testID?: string;
};

function filterEntries(
  entries: MileageHistoryEntry[],
  mode: 'full-lease' | 'this-year',
): MileageHistoryEntry[] {
  if (mode === 'this-year') {
    const currentYear = new Date().getFullYear();
    return entries.filter(e => new Date(e.date).getFullYear() === currentYear);
  }
  return entries;
}

function formatMonthLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.toLocaleString('default', { month: 'short' })} '${String(d.getFullYear()).slice(2)}`;
}

export function ProjectionChart({
  entries,
  mode,
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

  const actualData = filtered.map((e, i) => ({
    value: e.mileage,
    label: i % Math.ceil(filtered.length / 4) === 0 ? formatMonthLabel(e.date) : '',
    dataPointText: '',
  }));

  const expectedData = filtered.map(e => ({
    value: e.projectedMileage,
    dataPointText: '',
  }));

  return (
    <View style={styles.container} testID={testID ?? 'projection-chart'}>
      <LineChart
        data={actualData}
        data2={expectedData}
        color1={theme.colors.primary}
        color2={theme.colors.warning}
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
