import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { getLeases, getLeaseSummary } from '../../api/leaseApi';
import { getStatus } from '../../api/subscriptionApi';
import { PremiumGate } from '../../components/PremiumGate';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useTheme } from '../../theme';
import type { HomeStackNavigationProp } from '../../navigation/types';
import type { Lease, LeaseSummary } from '../../types/api';

export type PaceStatus = 'on-track' | 'slightly-over' | 'over-pace';

export function computePaceStatus(summary: LeaseSummary, totalMiles: number): PaceStatus {
  if (summary.pace_status !== 'ahead') {
    return 'on-track';
  }
  if (totalMiles > 0 && summary.projected_miles_at_end / totalMiles > 1.1) {
    return 'over-pace';
  }
  return 'slightly-over';
}

const STATUS_CONFIG: Record<
  PaceStatus,
  { label: string; icon: string; colorKey: 'success' | 'warning' | 'error' }
> = {
  'on-track': { label: 'On Track', icon: '✓', colorKey: 'success' },
  'slightly-over': { label: 'Slightly Over', icon: '!', colorKey: 'warning' },
  'over-pace': { label: 'Over Pace', icon: '⚠', colorKey: 'error' },
};

function formatVehicleLabel(lease: Lease): string {
  return lease.display_name;
}

export function LeaseComparisonScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<HomeStackNavigationProp>();

  const {
    data: leases,
    isLoading: leasesLoading,
    error: leasesError,
  } = useQuery({
    queryKey: ['leases'],
    queryFn: getLeases,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: getStatus,
  });

  const isPremium = subscription?.isPremium ?? false;

  // Fetch summaries for all leases
  const lease1 = leases?.[0];
  const lease2 = leases?.[1];
  const lease3 = leases?.[2];
  const lease4 = leases?.[3];

  const { data: summary1 } = useQuery({
    queryKey: ['lease-summary', lease1?.id],
    queryFn: () => getLeaseSummary(lease1!.id),
    enabled: lease1 != null,
  });

  const { data: summary2 } = useQuery({
    queryKey: ['lease-summary', lease2?.id],
    queryFn: () => getLeaseSummary(lease2!.id),
    enabled: lease2 != null,
  });

  const { data: summary3 } = useQuery({
    queryKey: ['lease-summary', lease3?.id],
    queryFn: () => getLeaseSummary(lease3!.id),
    enabled: lease3 != null,
  });

  const { data: summary4 } = useQuery({
    queryKey: ['lease-summary', lease4?.id],
    queryFn: () => getLeaseSummary(lease4!.id),
    enabled: lease4 != null,
  });

  const summaries: (LeaseSummary | undefined)[] = [summary1, summary2, summary3, summary4];

  if (leasesLoading) {
    return (
      <SafeAreaView
        style={[styles.flex, { backgroundColor: theme.colors.background }]}
        testID="lease-comparison-screen"
      >
        <ScreenHeader title="Compare Leases" onBackPress={() => navigation.goBack()} />
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            testID="lease-comparison-loading"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (leasesError != null || leases == null || leases.length < 2) {
    return (
      <SafeAreaView
        style={[styles.flex, { backgroundColor: theme.colors.background }]}
        testID="lease-comparison-screen"
      >
        <ScreenHeader title="Compare Leases" onBackPress={() => navigation.goBack()} />
        <View style={styles.center}>
          <Text
            style={[styles.emptyText, { color: theme.colors.textSecondary }]}
            testID="lease-comparison-empty"
          >
            {'You need at least 2 active leases to compare.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      testID="lease-comparison-screen"
    >
      <ScreenHeader title="Compare Leases" onBackPress={() => navigation.goBack()} />
      <PremiumGate
        isPremium={isPremium}
        onUpgrade={() => navigation.getParent()?.navigate('Settings' as never, { screen: 'Subscription' })}
        description="Compare your leases side-by-side with Premium."
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          testID="lease-comparison-scroll"
        >
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}
            testID="lease-comparison-title"
          >
            {'Lease Comparison'}
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
            testID="lease-comparison-subtitle"
          >
            {'Side-by-side view of all your active leases'}
          </Text>

          {/* Comparison cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRow}
            testID="lease-comparison-cards-row"
          >
            {leases.map((lease, index) => {
              const summary = summaries[index];
              return (
                <ComparisonCard
                  key={lease.id}
                  lease={lease}
                  summary={summary}
                  onPress={() => navigation.navigate('LeaseDetail', { leaseId: lease.id })}
                />
              );
            })}
          </ScrollView>

          {/* Summary table */}
          <View
            style={[styles.tableContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            testID="lease-comparison-table"
          >
            <Text
              style={[styles.tableTitle, { color: theme.colors.textPrimary }]}
              testID="lease-comparison-table-title"
            >
              {'Quick Summary'}
            </Text>

            {/* Header row */}
            <View style={[styles.tableRow, styles.tableHeaderRow, { borderBottomColor: theme.colors.border }]}>
              <View style={styles.tableLabelCell}>
                <Text style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}>
                  {'Metric'}
                </Text>
              </View>
              {leases.map(lease => (
                <View key={lease.id} style={styles.tableValueCell}>
                  <Text
                    style={[styles.tableHeaderText, { color: theme.colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {lease.display_name}
                  </Text>
                </View>
              ))}
            </View>

            {/* Miles Remaining */}
            <View
              style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}
              testID="lease-comparison-row-miles"
            >
              <View style={styles.tableLabelCell}>
                <Text style={[styles.tableLabelText, { color: theme.colors.textSecondary }]}>
                  {'Miles Left'}
                </Text>
              </View>
              {leases.map((lease, index) => {
                const s = summaries[index];
                return (
                  <View key={lease.id} style={styles.tableValueCell}>
                    <Text style={[styles.tableValueText, { color: theme.colors.textPrimary }]}>
                      {s != null ? s.milesRemaining.toLocaleString() : '—'}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Days Remaining */}
            <View
              style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}
              testID="lease-comparison-row-days"
            >
              <View style={styles.tableLabelCell}>
                <Text style={[styles.tableLabelText, { color: theme.colors.textSecondary }]}>
                  {'Days Left'}
                </Text>
              </View>
              {leases.map((lease, index) => {
                const s = summaries[index];
                return (
                  <View key={lease.id} style={styles.tableValueCell}>
                    <Text style={[styles.tableValueText, { color: theme.colors.textPrimary }]}>
                      {s != null ? s.daysRemaining.toLocaleString() : '—'}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Pace Status */}
            <View
              style={[styles.tableRow, { borderBottomColor: theme.colors.border }]}
              testID="lease-comparison-row-pace"
            >
              <View style={styles.tableLabelCell}>
                <Text style={[styles.tableLabelText, { color: theme.colors.textSecondary }]}>
                  {'Pace'}
                </Text>
              </View>
              {leases.map((lease, index) => {
                const s = summaries[index];
                if (s == null) {
                  return (
                    <View key={lease.id} style={styles.tableValueCell}>
                      <Text style={[styles.tableValueText, { color: theme.colors.textSecondary }]}>
                        {'—'}
                      </Text>
                    </View>
                  );
                }
                const pace = computePaceStatus(s);
                const config = STATUS_CONFIG[pace];
                const color = theme.colors[config.colorKey];
                return (
                  <View key={lease.id} style={styles.tableValueCell}>
                    <Text style={[styles.tableValueText, { color, fontWeight: '600' }]}>
                      {config.label}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Miles/Day to Stay on Track */}
            <View
              style={styles.tableRow}
              testID="lease-comparison-row-daily"
            >
              <View style={styles.tableLabelCell}>
                <Text style={[styles.tableLabelText, { color: theme.colors.textSecondary }]}>
                  {'Mi/Day'}
                </Text>
              </View>
              {leases.map((lease, index) => {
                const s = summaries[index];
                const daily =
                  s != null && s.daysRemaining > 0
                    ? Math.ceil(s.milesRemaining / s.daysRemaining)
                    : 0;
                return (
                  <View key={lease.id} style={styles.tableValueCell}>
                    <Text style={[styles.tableValueText, { color: theme.colors.textPrimary }]}>
                      {s != null ? `${daily}` : '—'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </PremiumGate>
    </SafeAreaView>
  );
}

type ComparisonCardProps = {
  lease: Lease;
  summary: LeaseSummary | undefined;
  onPress: () => void;
};

function ComparisonCard({ lease, summary, onPress }: ComparisonCardProps): React.ReactElement {
  const theme = useTheme();
  const label = formatVehicleLabel(lease);

  const paceStatus = summary != null ? computePaceStatus(summary, lease.total_miles_allowed) : null;
  const paceConfig = paceStatus != null ? STATUS_CONFIG[paceStatus] : null;
  const paceColor = paceConfig != null ? theme.colors[paceConfig.colorKey] : theme.colors.textSecondary;

  const milesRemaining = summary?.miles_remaining ?? 0;
  const daysRemaining = summary?.days_remaining ?? 0;
  const progress =
    summary != null && lease.total_miles_allowed > 0
      ? Math.min(summary.miles_driven / lease.total_miles_allowed, 1)
      : 0;

  const progressColor =
    progress < 0.8
      ? theme.colors.success
      : progress < 0.95
        ? theme.colors.warning
        : theme.colors.error;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${label}`}
      testID={`comparison-card-${lease.id}`}
    >
      {/* Vehicle name */}
      <Text
        style={[styles.cardVehicle, { color: theme.colors.textPrimary }]}
        numberOfLines={2}
        testID={`comparison-card-label-${lease.id}`}
      >
        {label}
      </Text>

      {/* Progress bar */}
      <View
        style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}
        testID={`comparison-card-progress-${lease.id}`}
      >
        <View
          style={[
            styles.progressFill,
            { backgroundColor: progressColor, width: `${Math.round(progress * 100)}%` as any },
          ]}
        />
      </View>
      <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
        {summary != null
          ? `${Math.round(progress * 100)}% used`
          : 'Loading...'}
      </Text>

      {/* Pace badge */}
      {paceConfig != null && (
        <View
          style={[styles.cardBadge, { borderColor: paceColor }]}
          testID={`comparison-card-pace-${lease.id}`}
        >
          <View style={[StyleSheet.absoluteFill, styles.cardBadgeBg, { backgroundColor: paceColor }]} />
          <Text style={[styles.cardBadgeText, { color: paceColor }]}>
            {`${paceConfig.icon} ${paceConfig.label}`}
          </Text>
        </View>
      )}

      {/* Key stats */}
      <View style={styles.cardStats}>
        <View style={styles.cardStatItem}>
          <Text
            style={[styles.cardStatValue, { color: theme.colors.textPrimary }]}
            testID={`comparison-card-miles-${lease.id}`}
          >
            {milesRemaining.toLocaleString()}
          </Text>
          <Text style={[styles.cardStatLabel, { color: theme.colors.textSecondary }]}>
            {'miles left'}
          </Text>
        </View>
        <View style={[styles.cardStatDivider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.cardStatItem}>
          <Text
            style={[styles.cardStatValue, { color: theme.colors.textPrimary }]}
            testID={`comparison-card-days-${lease.id}`}
          >
            {daysRemaining.toLocaleString()}
          </Text>
          <Text style={[styles.cardStatLabel, { color: theme.colors.textSecondary }]}>
            {'days left'}
          </Text>
        </View>
      </View>

      {/* Tap hint */}
      <Text style={[styles.tapHint, { color: theme.colors.primary }]}>
        {'View Details →'}
      </Text>
    </TouchableOpacity>
  );
}

const CARD_WIDTH = 220;

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
    padding: 16,
    width: CARD_WIDTH,
  },
  cardBadge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cardBadgeBg: {
    borderRadius: 12,
    opacity: 0.12,
  },
  cardBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardStatDivider: {
    height: '70%',
    width: 1,
  },
  cardStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  cardStatLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  cardStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardStats: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 16,
  },
  cardVehicle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  cardsRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  flex: {
    flex: 1,
  },
  progressFill: {
    borderRadius: 3,
    height: '100%',
  },
  progressText: {
    fontSize: 11,
    marginTop: 4,
  },
  progressTrack: {
    borderRadius: 3,
    height: 6,
    marginTop: 12,
    overflow: 'hidden',
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    paddingHorizontal: 16,
  },
  tableLabelCell: {
    flex: 1.2,
    paddingVertical: 10,
  },
  tableLabelText: {
    fontSize: 13,
  },
  tableContainer: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
  },
  tableHeaderRow: {
    borderBottomWidth: 1,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tableRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  tableValueCell: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 10,
  },
  tableValueText: {
    fontSize: 13,
    fontWeight: '500',
  },
  tapHint: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
});
