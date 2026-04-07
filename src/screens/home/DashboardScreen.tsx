import React, { useEffect, useMemo, useState } from 'react';
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
import { getTrips } from '../../api/tripsApi';
import { getStatus } from '../../api/subscriptionApi';
import { BannerAdView } from '../../components/ads/BannerAdView';
import { ErrorMessage } from '../../components/ErrorMessage';
import { LeaseSelectorPills } from '../../components/LeaseSelectorPills';
import { MileageProgressRing } from '../../components/MileageProgressRing';
import { PaceStatusBadge } from '../../components/PaceStatusBadge';
import type { PaceStatus } from '../../components/PaceStatusBadge';
import { QuickAddFAB } from '../../components/QuickAddFAB';
import { StatCard } from '../../components/StatCard';
import { useTheme } from '../../theme';
import type { HomeStackNavigationProp } from '../../navigation/types';
import { useLeasesStore } from '../../stores/leasesStore';
import { computeThisYearStats } from '../../utils/leaseYear';

type Mode = 'full-lease' | 'this-year';

export function DashboardScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<HomeStackNavigationProp>();

  const activeLeaseId = useLeasesStore(state => state.activeLeaseId);
  const setActiveLeaseId = useLeasesStore(state => state.setActiveLeaseId);

  const [mode, setMode] = useState<Mode>('full-lease');

  const {
    data: leases,
    isLoading: leasesLoading,
    error: leasesError,
  } = useQuery({
    queryKey: ['leases'],
    queryFn: getLeases,
  });

  useEffect(() => {
    if (leases && leases.length > 0) {
      const isValid = leases.some(l => l.id === activeLeaseId);
      if (!isValid) {
        setActiveLeaseId(leases[0].id);
      }
    }
  }, [leases, activeLeaseId, setActiveLeaseId]);

  const {
    data: summary,
    isLoading: summaryLoading,
  } = useQuery({
    queryKey: ['lease-summary', activeLeaseId],
    queryFn: () => getLeaseSummary(activeLeaseId as string),
    enabled: activeLeaseId != null,
  });

  const { data: tripsData } = useQuery({
    queryKey: ['trips', activeLeaseId],
    queryFn: () => getTrips(activeLeaseId as string),
    enabled: activeLeaseId != null,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: getStatus,
  });

  const isPremium = subscription?.isPremium ?? false;
  const selectedLease = leases?.find(l => l.id === activeLeaseId);
  const activeTrips = tripsData?.active ?? [];
  const reservedMiles = activeTrips.reduce((sum, t) => sum + t.distance, 0);

  const thisYearStats = useMemo(() => {
    if (selectedLease == null || summary == null) {
      return null;
    }
    return computeThisYearStats(selectedLease, summary);
  }, [selectedLease, summary]);

  // Display values that change based on mode
  const displayMilesRemaining =
    mode === 'this-year' && thisYearStats != null
      ? thisYearStats.milesRemainingThisYear
      : (summary?.milesRemaining ?? 0);
  const displayDaysRemaining =
    mode === 'this-year' && thisYearStats != null
      ? thisYearStats.daysRemainingThisYear
      : (summary?.daysRemaining ?? 0);
  const displayTotalMiles =
    mode === 'this-year' && thisYearStats != null
      ? thisYearStats.totalMilesThisYear
      : (summary?.totalMiles ?? 0);
  const displayMilesUsed =
    mode === 'this-year' && thisYearStats != null
      ? thisYearStats.milesUsedThisYear
      : (summary?.milesUsed ?? 0);

  const paceStatus: PaceStatus =
    mode === 'this-year' && thisYearStats != null
      ? thisYearStats.isOverPaceThisYear
        ? thisYearStats.totalMilesThisYear > 0 &&
          thisYearStats.projectedMilesThisYear / thisYearStats.totalMilesThisYear > 1.1
          ? 'over-pace'
          : 'slightly-over'
        : 'on-track'
      : summary?.isOverPace === true
        ? summary.totalMiles > 0 && summary.projectedMiles / summary.totalMiles > 1.1
          ? 'over-pace'
          : 'slightly-over'
        : 'on-track';

  const recommendedPace =
    mode === 'this-year' && thisYearStats != null && thisYearStats.daysRemainingThisYear > 0
      ? Math.ceil(thisYearStats.milesRemainingThisYear / thisYearStats.daysRemainingThisYear)
      : summary != null && summary.daysRemaining > 0
        ? Math.ceil(summary.milesRemaining / summary.daysRemaining)
        : 0;

  if (leasesLoading || summaryLoading) {
    return (
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
        testID="dashboard-screen"
      >
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          testID="dashboard-loading"
        />
      </View>
    );
  }

  if (leasesError != null) {
    return (
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
        testID="dashboard-screen"
      >
        <ErrorMessage
          message="Failed to load lease data"
          onRetry={() => navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] })}
        />
      </View>
    );
  }

  if (!leases || leases.length === 0) {
    return (
      <SafeAreaView
        style={[styles.flex, { backgroundColor: theme.colors.background }]}
        testID="dashboard-screen"
      >
        <View style={styles.center}>
          <Text
            style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}
            testID="dashboard-title"
          >
            {'No Active Leases'}
          </Text>
          <Text
            style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}
            testID="dashboard-empty-subtitle"
          >
            {'Add a lease to get started tracking your mileage.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      testID="dashboard-screen"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="dashboard-scroll"
      >
        {/* Screen title */}
        <Text
          style={[styles.screenTitle, { color: theme.colors.textPrimary }]}
          testID="dashboard-title"
        >
          {'Dashboard'}
        </Text>

        {/* Active lease selector — only if 2+ leases */}
        {leases.length >= 2 && activeLeaseId != null && (
          <LeaseSelectorPills
            leases={leases}
            selectedId={activeLeaseId}
            onSelect={setActiveLeaseId}
          />
        )}

        {/* Full Lease / This Year toggle */}
        {summary != null && (
          <View
            style={[
              styles.toggleRow,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
            testID="dashboard-toggle"
          >
            <TouchableOpacity
              style={[
                styles.toggleButton,
                mode === 'full-lease' && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setMode('full-lease')}
              testID="dashboard-toggle-full-lease"
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
              testID="dashboard-toggle-this-year"
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
        )}

        {/* Mileage progress ring */}
        {summary != null && (
          <View style={styles.ringContainer} testID="dashboard-ring-container">
            <MileageProgressRing
              totalMiles={displayTotalMiles}
              usedMiles={displayMilesUsed}
            />
          </View>
        )}

        {/* Headline stats row */}
        <View
          style={[
            styles.statsRow,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          testID="dashboard-stats-row"
        >
          <StatCard
            label="Miles Remaining"
            value={displayMilesRemaining}
            unit="mi"
            testID="stat-miles-remaining"
          />
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          <StatCard
            label="Days Left"
            value={displayDaysRemaining}
            unit="days"
            testID="stat-days-left"
          />
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          <StatCard
            label="Monthly Miles"
            value={selectedLease?.monthlyMiles ?? 0}
            unit="mi"
            testID="stat-monthly-miles"
          />
        </View>

        {/* Pace status badge */}
        <View style={styles.badgeContainer} testID="dashboard-badge-container">
          <PaceStatusBadge status={paceStatus} />
        </View>

        {/* Recommended pace callout */}
        {recommendedPace > 0 && (
          <View
            style={[
              styles.callout,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            testID="dashboard-pace-callout"
          >
            <Text
              style={[styles.calloutText, { color: theme.colors.textSecondary }]}
              testID="dashboard-pace-callout-text"
            >
              {`Drive ≤ ${recommendedPace} miles/day to stay on track`}
            </Text>
          </View>
        )}

        {/* Reserved for trips row */}
        {activeTrips.length > 0 && (
          <View
            style={[
              styles.reservedRow,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            testID="dashboard-reserved-row"
          >
            <Text
              style={[styles.reservedLabel, { color: theme.colors.textSecondary }]}
              testID="dashboard-reserved-label"
            >
              {'Reserved for trips'}
            </Text>
            <Text
              style={[styles.reservedValue, { color: theme.colors.textPrimary }]}
              testID="dashboard-reserved-value"
            >
              {`${reservedMiles.toLocaleString()} mi`}
            </Text>
          </View>
        )}

        {/* Quick-action row */}
        <View style={styles.quickActions} testID="dashboard-quick-actions">
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              if (activeLeaseId != null) {
                navigation.navigate('AddReading', { leaseId: activeLeaseId });
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Log Odometer"
            testID="action-log-odometer"
          >
            <Text style={[styles.actionLabel, { color: theme.colors.surface }]}>
              {'+ Log Odometer'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.actionButtonOutline,
              { borderColor: theme.colors.primary },
            ]}
            onPress={() => {
              if (activeLeaseId != null) {
                navigation.navigate('PaceDetail', { leaseId: activeLeaseId });
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="View Full Stats"
            testID="action-view-stats"
          >
            <Text style={[styles.actionLabel, { color: theme.colors.primary }]}>
              {'View Full Stats'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.actionButtonOutline,
              { borderColor: theme.colors.primary },
            ]}
            onPress={() => {
              navigation.getParent()?.navigate('Trips' as never);
            }}
            accessibilityRole="button"
            accessibilityLabel="Trips"
            testID="action-trips"
          >
            <Text style={[styles.actionLabel, { color: theme.colors.primary }]}>
              {'Trips'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating action button — navigate to AddReading for active lease */}
      <QuickAddFAB
        onPress={() => {
          navigation.navigate('AddReading', { leaseId: activeLeaseId as string });
        }}
        disabled={activeLeaseId == null}
      />

      {/* Banner ad — free tier only */}
      {!isPremium && <BannerAdView />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 12,
  },
  actionButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  badgeContainer: {
    marginTop: 12,
  },
  callout: {
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  calloutText: {
    fontSize: 14,
    textAlign: 'center',
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  flex: {
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    marginHorizontal: 12,
    marginTop: 16,
  },
  reservedLabel: {
    fontSize: 13,
  },
  reservedRow: {
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  reservedValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  ringContainer: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 12,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  toggleButton: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  toggleRow: {
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 96,
  },
  statDivider: {
    height: '70%',
    width: 1,
  },
  statsRow: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
});
