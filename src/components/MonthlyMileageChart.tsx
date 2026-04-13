import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useTheme } from '../theme';
import type { MileageHistoryEntry } from '../types/api';

type MonthlyMileageChartProps = {
  entries: MileageHistoryEntry[];
  mode: 'full-lease' | 'this-year';
  monthlyAllowance?: number;
  testID?: string;
};

type MonthlyBar = {
  value: number;
  label: string;
  frontColor: string;
};

function buildMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatBarLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleString('default', { month: 'short' });
}

export function computeMonthlyBars(
  entries: MileageHistoryEntry[],
  mode: 'full-lease' | 'this-year',
  primaryColor: string,
): MonthlyBar[] {
  const filtered =
    mode === 'this-year'
      ? entries.filter(e => {
          const [year] = e.month.split('-');
          return Number(year) === new Date().getFullYear();
        })
      : entries;

  if (filtered.length === 0) {
    return [];
  }

  // Group by month — take the last entry's miles_driven per month
  const byMonth = new Map<string, number>();
  for (const entry of filtered) {
    const key = entry.month;
    byMonth.set(key, entry.miles_driven);
  }

  const sortedKeys = Array.from(byMonth.keys()).sort();

  const bars: MonthlyBar[] = [];
  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    const endMileage = byMonth.get(key) ?? 0;
    const prevMileage = i > 0 ? (byMonth.get(sortedKeys[i - 1]) ?? 0) : 0;
    const miles = Math.max(0, endMileage - prevMileage);
    bars.push({
      value: miles,
      label: formatBarLabel(key),
      frontColor: primaryColor,
    });
  }

  return bars;
}

export function MonthlyMileageChart({
  entries,
  mode,
  monthlyAllowance,
  testID,
}: MonthlyMileageChartProps): React.ReactElement {
  const theme = useTheme();
  const bars = computeMonthlyBars(entries, mode, theme.colors.primary);

  if (bars.length === 0) {
    return (
      <View
        style={[styles.empty, { borderColor: theme.colors.border }]}
        testID={testID ?? 'monthly-mileage-chart'}
      >
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          {'No data available'}
        </Text>
      </View>
    );
  }

  const showThreshold = monthlyAllowance != null && monthlyAllowance > 0;

  return (
    <View style={styles.container} testID={testID ?? 'monthly-mileage-chart'}>
      <BarChart
        data={bars}
        barWidth={28}
        barBorderRadius={4}
        xAxisLabelTextStyle={{ color: theme.colors.textSecondary, fontSize: 10 }}
        yAxisTextStyle={{ color: theme.colors.textSecondary, fontSize: 10 }}
        yAxisColor={theme.colors.border}
        xAxisColor={theme.colors.border}
        rulesColor={theme.colors.border}
        backgroundColor={theme.colors.surface}
        isAnimated
        width={300}
        height={180}
        noOfSections={4}
        showReferenceLine1={showThreshold}
        referenceLine1Position={monthlyAllowance}
        referenceLine1Config={{
          color: theme.colors.warning,
          width: 2,
          type: 'dashed',
          dashWidth: 6,
          dashGap: 4,
        }}
      />
      {showThreshold && (
        <View style={styles.legend} testID="monthly-chart-legend">
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.primary }]} />
            <Text style={[styles.legendLabel, { color: theme.colors.textSecondary }]}>
              {'Miles Driven'}
            </Text>
          </View>
          <View style={styles.legendItem} testID="monthly-allowance-legend-item">
            <View
              style={[styles.legendDash, { backgroundColor: theme.colors.warning }]}
              testID="monthly-allowance-legend-dash"
            />
            <Text style={[styles.legendLabel, { color: theme.colors.textSecondary }]}>
              {'Monthly Allowance'}
            </Text>
          </View>
        </View>
      )}
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
  legendDash: {
    borderRadius: 1,
    height: 3,
    marginRight: 4,
    width: 16,
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
