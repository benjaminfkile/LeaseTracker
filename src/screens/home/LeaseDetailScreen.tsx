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
import { getLease, getLeaseSummary, getLeaseMembers } from '../../api/leaseApi';
import { getReadings } from '../../api/readingsApi';
import { getTrips } from '../../api/tripsApi';
import { getStatus } from '../../api/subscriptionApi';
import { BannerAdView } from '../../components/BannerAdView';
import { ErrorMessage } from '../../components/ErrorMessage';
import { MileageProgressRing } from '../../components/MileageProgressRing';
import { PaceStatusBadge } from '../../components/PaceStatusBadge';
import type { PaceStatus } from '../../components/PaceStatusBadge';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatCard } from '../../components/StatCard';
import { useTheme } from '../../theme';
import type { HomeStackNavigationProp, HomeStackParamList } from '../../navigation/types';

type LeaseDetailRouteProp = RouteProp<HomeStackParamList, 'LeaseDetail'>;

// ---------- LeaseInfoRow helper ----------

type LeaseInfoRowProps = {
  label: string;
  value: string;
  testID?: string;
};

function LeaseInfoRow({ label, value, testID }: LeaseInfoRowProps): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={infoRowStyles.container} testID={testID}>
      <Text style={[infoRowStyles.label, { color: theme.colors.textSecondary }]}>{label}</Text>
      <Text style={[infoRowStyles.value, { color: theme.colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
});

// ---------- LeaseDetailScreen ----------

export function LeaseDetailScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<HomeStackNavigationProp>();
  const route = useRoute<LeaseDetailRouteProp>();
  const { leaseId } = route.params;

  const [leaseInfoExpanded, setLeaseInfoExpanded] = useState(false);

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
    enabled: leaseId != null,
  });

  const { data: readings } = useQuery({
    queryKey: ['readings', leaseId],
    queryFn: () => getReadings(leaseId),
    enabled: leaseId != null,
  });

  const { data: tripsData } = useQuery({
    queryKey: ['trips', leaseId],
    queryFn: () => getTrips(leaseId),
    enabled: leaseId != null,
  });

  const { data: members } = useQuery({
    queryKey: ['lease-members', leaseId],
    queryFn: () => getLeaseMembers(leaseId),
    enabled: leaseId != null,
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: getStatus,
  });

  const isPremium = subscription?.isPremium ?? false;

  const latestReading = readings != null && readings.length > 0 ? readings[0] : null;

  const allTrips = [...(tripsData?.active ?? []), ...(tripsData?.completed ?? [])];
  const tripCount = allTrips.length;

  const sharedMembers = members?.filter(m => m.role === 'viewer') ?? [];

  const paceStatus: PaceStatus =
    summary?.isOverPace === true
      ? summary.totalMiles > 0 && summary.projectedMiles / summary.totalMiles > 1.1
        ? 'over-pace'
        : 'slightly-over'
      : 'on-track';

  const recommendedPace =
    summary != null && summary.daysRemaining > 0
      ? Math.ceil(summary.milesRemaining / summary.daysRemaining)
      : 0;

  const vehicleLabel = lease
    ? `${lease.vehicleYear} ${lease.vehicleMake} ${lease.vehicleModel}${lease.vehicleTrim ? ` ${lease.vehicleTrim}` : ''}`
    : 'Lease Detail';

  if (leaseLoading || summaryLoading) {
    return (
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
        testID="lease-detail-screen"
      >
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          testID="lease-detail-loading"
        />
      </View>
    );
  }

  if (leaseError != null) {
    return (
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
        testID="lease-detail-screen"
      >
        <ErrorMessage
          message="Failed to load lease data"
          onRetry={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      testID="lease-detail-screen"
    >
      <ScreenHeader
        title={vehicleLabel}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="lease-detail-scroll"
      >
        {/* Mileage progress ring */}
        {summary != null && (
          <View style={styles.ringContainer} testID="lease-detail-ring-container">
            <MileageProgressRing
              totalMiles={summary.totalMiles}
              usedMiles={summary.milesUsed}
            />
          </View>
        )}

        {/* Stats row */}
        <View
          style={[
            styles.statsRow,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          testID="lease-detail-stats-row"
        >
          <StatCard
            label="Miles Remaining"
            value={summary?.milesRemaining ?? 0}
            unit="mi"
            testID="stat-miles-remaining"
          />
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          <StatCard
            label="Days Left"
            value={summary?.daysRemaining ?? 0}
            unit="days"
            testID="stat-days-left"
          />
          <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
          <StatCard
            label="Monthly Miles"
            value={lease?.monthlyMiles ?? 0}
            unit="mi"
            testID="stat-monthly-miles"
          />
        </View>

        {/* Pace status badge */}
        <View style={styles.badgeContainer} testID="lease-detail-badge-container">
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
            testID="lease-detail-pace-callout"
          >
            <Text
              style={[styles.calloutText, { color: theme.colors.textSecondary }]}
              testID="lease-detail-pace-callout-text"
            >
              {`Drive ≤ ${recommendedPace} miles/day to stay on track`}
            </Text>
          </View>
        )}

        {/* Odometer Log row */}
        <TouchableOpacity
          style={[
            styles.listRow,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          onPress={() => navigation.navigate('OdometerLog', { leaseId })}
          accessibilityRole="button"
          accessibilityLabel="Odometer Log"
          testID="odometer-log-row"
        >
          <View style={styles.listRowContent}>
            <Text style={[styles.listRowLabel, { color: theme.colors.textPrimary }]}>
              {'Odometer Log'}
            </Text>
            {latestReading != null && (
              <Text
                style={[styles.listRowValue, { color: theme.colors.textSecondary }]}
                testID="odometer-latest-reading"
              >
                {`${latestReading.mileage.toLocaleString()} mi`}
              </Text>
            )}
          </View>
          <Text
            style={[styles.viewAllText, { color: theme.colors.primary }]}
            testID="odometer-view-all"
          >
            {'View All →'}
          </Text>
        </TouchableOpacity>

        {/* Saved Trips row */}
        <TouchableOpacity
          style={[
            styles.listRow,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          onPress={() => navigation.getParent()?.navigate('Trips' as never)}
          accessibilityRole="button"
          accessibilityLabel="Saved Trips"
          testID="saved-trips-row"
        >
          <View style={styles.listRowContent}>
            <Text style={[styles.listRowLabel, { color: theme.colors.textPrimary }]}>
              {'Saved Trips'}
            </Text>
            <Text
              style={[styles.listRowValue, { color: theme.colors.textSecondary }]}
              testID="saved-trips-count"
            >
              {`${tripCount} trip${tripCount !== 1 ? 's' : ''}`}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>{'→'}</Text>
        </TouchableOpacity>

        {/* Shared With row */}
        <View
          style={[
            styles.listRow,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          testID="shared-with-row"
        >
          <View style={styles.listRowContent}>
            <Text style={[styles.listRowLabel, { color: theme.colors.textPrimary }]}>
              {'Shared With'}
            </Text>
            {sharedMembers.length === 0 ? (
              <Text
                style={[styles.listRowValue, { color: theme.colors.textSecondary }]}
                testID="shared-with-only-you"
              >
                {'Only you'}
              </Text>
            ) : (
              <View style={styles.avatarsRow} testID="shared-with-avatars">
                {sharedMembers.slice(0, 3).map(member => (
                  <View
                    key={member.id}
                    style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
                    testID={`member-avatar-${member.id}`}
                  >
                    <Text style={[styles.avatarInitial, { color: theme.colors.surface }]}>
                      {member.email.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                ))}
                {sharedMembers.length > 3 && (
                  <View
                    style={[styles.avatar, { backgroundColor: theme.colors.border }]}
                    testID="member-avatar-overflow"
                  >
                    <Text
                      style={[styles.avatarInitial, { color: theme.colors.textPrimary }]}
                    >
                      {`+${sharedMembers.length - 3}`}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
          <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>{'→'}</Text>
        </View>

        {/* Lease Info collapsible panel */}
        <View
          style={[
            styles.panel,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          testID="lease-info-panel"
        >
          <TouchableOpacity
            style={styles.panelHeader}
            onPress={() => setLeaseInfoExpanded(prev => !prev)}
            accessibilityRole="button"
            testID="lease-info-toggle"
          >
            <Text style={[styles.panelTitle, { color: theme.colors.textPrimary }]}>
              {'Lease Info'}
            </Text>
            <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>
              {leaseInfoExpanded ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {leaseInfoExpanded && lease != null && (
            <View style={styles.panelBody} testID="lease-info-body">
              <LeaseInfoRow
                label="Vehicle"
                value={vehicleLabel}
                testID="lease-info-vehicle"
              />
              <LeaseInfoRow
                label="Start Date"
                value={lease.startDate}
                testID="lease-info-start-date"
              />
              <LeaseInfoRow
                label="End Date"
                value={lease.endDate}
                testID="lease-info-end-date"
              />
              <LeaseInfoRow
                label="Total Miles"
                value={`${lease.totalMiles.toLocaleString()} mi`}
                testID="lease-info-total-miles"
              />
              <LeaseInfoRow
                label="Starting Odometer"
                value={`${lease.startingMileage.toLocaleString()} mi`}
                testID="lease-info-starting-odometer"
              />
            </View>
          )}
        </View>

        {/* End of Lease Tools section */}
        <View style={styles.sectionHeader} testID="end-of-lease-section">
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            {'End of Lease Tools'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.toolRow,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          onPress={() => navigation.navigate('LeaseEndOptions', { leaseId })}
          accessibilityRole="button"
          accessibilityLabel="Lease End Options"
          testID="lease-end-options-row"
        >
          <Text style={[styles.toolLabel, { color: theme.colors.textPrimary }]}>
            {'Lease End Options'}
          </Text>
          <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>{'→'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toolRow,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          onPress={() => navigation.navigate('BuybackAnalysis', { leaseId })}
          accessibilityRole="button"
          accessibilityLabel="Buyback Analysis"
          testID="buyback-analysis-row"
        >
          <Text style={[styles.toolLabel, { color: theme.colors.textPrimary }]}>
            {'Buyback Analysis'}
          </Text>
          <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>{'→'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toolRow,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
          onPress={() => {
            const parent = navigation.getParent();
            if (parent != null) {
              (parent.navigate as unknown as (screen: string, params: object) => void)(
                'Leases',
                { screen: 'TurnInChecklist', params: { leaseId } },
              );
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Turn-In Checklist"
          testID="turn-in-checklist-row"
        >
          <Text style={[styles.toolLabel, { color: theme.colors.textPrimary }]}>
            {'Turn-In Checklist'}
          </Text>
          <Text style={[styles.chevron, { color: theme.colors.textSecondary }]}>{'→'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Banner ad — free tier only */}
      {!isPremium && <BannerAdView />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    marginLeft: -4,
    width: 28,
  },
  avatarInitial: {
    fontSize: 12,
    fontWeight: '600',
  },
  avatarsRow: {
    flexDirection: 'row',
    paddingLeft: 4,
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
  chevron: {
    fontSize: 16,
  },
  flex: {
    flex: 1,
  },
  listRow: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  listRowContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 8,
  },
  listRowLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  listRowValue: {
    fontSize: 14,
  },
  panel: {
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 10,
    overflow: 'hidden',
  },
  panelBody: {
    borderTopColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  panelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  panelTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  ringContainer: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 12,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  sectionHeader: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
  toolLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  toolRow: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
