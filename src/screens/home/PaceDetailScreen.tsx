import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { getLease, getLeaseSummary, getMileageHistory } from '../../api/leaseApi';
import { getStatus } from '../../api/subscriptionApi';
import { BannerAdView } from '../../components/BannerAdView';
import { ErrorMessage } from '../../components/ErrorMessage';
import { MonthlyMileageChart } from '../../components/MonthlyMileageChart';
import { ProjectionChart } from '../../components/ProjectionChart';
import { useTheme } from '../../theme';
import type { HomeStackNavigationProp, HomeStackParamList } from '../../navigation/types';
import type { Lease, LeaseSummary } from '../../types/api';

type PaceDetailRouteProp = RouteProp<HomeStackParamList, 'PaceDetail'>;
type Mode = 'full-lease' | 'this-year';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DEFAULT_OVERAGE_COST_PER_MILE = 0.25;

export function computeDaysForwardBehind(
  lease: Lease,
  summary: LeaseSummary,
): { days: number; isAhead: boolean } {
  const start = new Date(lease.startDate).getTime();
  const end = new Date(lease.endDate).getTime();
  const totalDays = Math.max(1, (end - start) / MS_PER_DAY);
  const daysElapsed = Math.max(0, totalDays - summary.daysRemaining);
  const expectedMiles = (daysElapsed / totalDays) * summary.totalMiles;
  const mileDiff = summary.milesUsed - expectedMiles;
  const dailyRate = summary.totalMiles / totalDays;
  const days = Math.round(Math.abs(mileDiff) / Math.max(1, dailyRate));
  return { days, isAhead: mileDiff >= 0 };
}

export function PaceDetailScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<HomeStackNavigationProp>();
  const route = useRoute<PaceDetailRouteProp>();
  const { leaseId } = route.params;

  const [mode, setMode] = useState<Mode>('full-lease');

  const {
    data: lease,
    isLoading: leaseLoading,
    error: leaseError,
  } = useQuery({
    queryKey: ['lease', leaseId],
    queryFn: () => getLease(leaseId),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['lease-summary', leaseId],
    queryFn: () => getLeaseSummary(leaseId),
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['mileage-history', leaseId],
    queryFn: () => getMileageHistory(leaseId),
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: getStatus,
  });

  const isPremium = subscription?.isPremium ?? false;
  const isLoading = leaseLoading || summaryLoading || historyLoading;

  if (isLoading) {
    return (
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
        testID="pace-detail-screen"
      >
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          testID="pace-detail-loading"
        />
      </View>
    );
  }

  if (leaseError != null) {
    return (
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
        testID="pace-detail-screen"
      >
        <ErrorMessage
          message="Failed to load pace data"
          onRetry={() => navigation.goBack()}
        />
      </View>
    );
  }

  const entries = history?.entries ?? [];
  const projectedOverage =
    summary != null ? Math.max(0, summary.projectedMiles - summary.totalMiles) : 0;
  const costAtPace = projectedOverage * DEFAULT_OVERAGE_COST_PER_MILE;
  const forwardBehind =
    lease != null && summary != null
      ? computeDaysForwardBehind(lease, summary)
      : null;

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      testID="pace-detail-screen"
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID="pace-detail-back"
        >
          <Text style={[styles.backButton, { color: theme.colors.primary }]}>{'← Back'}</Text>
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
          testID="pace-detail-title"
        >
          {'Pace & Analytics'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Full Lease / This Year toggle */}
      <View
        style={[
          styles.toggleRow,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
        testID="pace-detail-toggle"
      >
        <TouchableOpacity
          style={[
            styles.toggleButton,
            mode === 'full-lease' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setMode('full-lease')}
          testID="toggle-full-lease"
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.toggleLabel,
              {
                color:
                  mode === 'full-lease' ? theme.colors.surface : theme.colors.textSecondary,
              },
            ]}
          >
            {'Full Lease'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            mode === 'this-year' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setMode('this-year')}
          testID="toggle-this-year"
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.toggleLabel,
              {
                color:
                  mode === 'this-year' ? theme.colors.surface : theme.colors.textSecondary,
              },
            ]}
          >
            {'This Year'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="pace-detail-scroll"
      >
        {/* Projection chart — expected vs actual miles */}
        <View
          style={[
            styles.sectionContainer,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          testID="pace-detail-projection-section"
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            {'Expected vs Actual Miles'}
          </Text>
          <ProjectionChart
            entries={entries}
            mode={mode}
            lease={lease}
            summary={summary}
            testID="projection-chart"
          />
        </View>

        {/* Monthly mileage bar chart */}
        <View
          style={[
            styles.sectionContainer,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          testID="pace-detail-monthly-section"
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            {'Miles per Month'}
          </Text>
          <MonthlyMileageChart
            entries={entries}
            mode={mode}
            monthlyAllowance={lease?.monthlyMiles}
            testID="monthly-mileage-chart"
          />
        </View>

        {/* Detailed stats table */}
        <View
          style={[
            styles.statsTable,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          testID="pace-detail-stats-table"
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            {'Detailed Stats'}
          </Text>

          <View style={[styles.statRow, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {'Miles Used'}
            </Text>
            <Text
              style={[styles.statValue, { color: theme.colors.textPrimary }]}
              testID="stats-miles-used"
            >
              {`${(summary?.milesUsed ?? 0).toLocaleString()} mi`}
            </Text>
          </View>

          <View style={[styles.statRow, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {'Miles Remaining'}
            </Text>
            <Text
              style={[styles.statValue, { color: theme.colors.textPrimary }]}
              testID="stats-miles-remaining"
            >
              {`${(summary?.milesRemaining ?? 0).toLocaleString()} mi`}
            </Text>
          </View>

          <View style={[styles.statRow, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {'Projected Total'}
            </Text>
            <Text
              style={[
                styles.statValue,
                {
                  color:
                    (summary?.projectedMiles ?? 0) > (summary?.totalMiles ?? 0)
                      ? theme.colors.error
                      : theme.colors.success,
                },
              ]}
              testID="stats-projected-total"
            >
              {`${(summary?.projectedMiles ?? 0).toLocaleString()} mi`}
            </Text>
          </View>

          <View style={[styles.statRow, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {'Days Forward/Behind'}
            </Text>
            <Text
              style={[
                styles.statValue,
                {
                  color:
                    forwardBehind?.isAhead === true
                      ? theme.colors.success
                      : theme.colors.warning,
                },
              ]}
              testID="stats-days-forward-behind"
            >
              {forwardBehind != null
                ? `${forwardBehind.days} day${forwardBehind.days !== 1 ? 's' : ''} ${forwardBehind.isAhead ? 'ahead' : 'behind'}`
                : '—'}
            </Text>
          </View>

          <View style={[styles.statRow, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {'Projected Overage'}
            </Text>
            <Text
              style={[
                styles.statValue,
                {
                  color:
                    projectedOverage > 0 ? theme.colors.error : theme.colors.success,
                },
              ]}
              testID="stats-projected-overage"
            >
              {projectedOverage > 0
                ? `+${projectedOverage.toLocaleString()} mi`
                : 'None'}
            </Text>
          </View>

          <View style={styles.statRow}>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {'Cost at Current Pace'}
            </Text>
            <Text
              style={[
                styles.statValue,
                {
                  color:
                    projectedOverage > 0
                      ? theme.colors.error
                      : theme.colors.textPrimary,
                },
              ]}
              testID="stats-cost-at-pace"
            >
              {projectedOverage > 0 ? `~$${costAtPace.toFixed(2)}` : '$0.00'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {!isPremium && <BannerAdView />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  flex: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerRight: {
    width: 50,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 96,
    paddingTop: 8,
  },
  sectionContainer: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    flex: 1,
  },
  statRow: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsTable: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  toggleButton: {
    borderRadius: 6,
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleRow: {
    borderBottomWidth: 1,
    borderTopWidth: 1,
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    padding: 4,
  },
});
