import React, { useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { BannerAdView } from '../../components/BannerAdView';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { LeaseSelectorPills } from '../../components/LeaseSelectorPills';
import { QuickAddFAB } from '../../components/QuickAddFAB';
import { ScreenHeader } from '../../components/ScreenHeader';
import { getTrips } from '../../api/tripsApi';
import { getStatus } from '../../api/subscriptionApi';
import { useLeasesStore } from '../../stores/leasesStore';
import { useTheme } from '../../theme';
import type { SavedTrip } from '../../types/api';
import type { TripsStackNavigationProp } from '../../navigation/types';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatTripDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

type TripCardProps = {
  trip: SavedTrip;
  completed?: boolean;
};

function TripCard({ trip, completed = false }: TripCardProps): React.ReactElement {
  const theme = useTheme();
  const name = trip.note?.trim() ? trip.note.trim() : 'Trip';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
        },
      ]}
      testID={`trip-card-${trip.id}`}
    >
      <View style={styles.cardLeft}>
        <Text
          style={[
            styles.tripName,
            { color: completed ? theme.colors.textSecondary : theme.colors.textPrimary },
          ]}
          testID={`trip-name-${trip.id}`}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text
          style={[styles.tripDate, { color: theme.colors.textSecondary }]}
          testID={`trip-date-${trip.id}`}
        >
          {formatTripDate(trip.tripDate)}
        </Text>
        <Text
          style={[styles.tripImpact, { color: theme.colors.textSecondary }]}
          testID={`trip-impact-${trip.id}`}
        >
          {`−${trip.distance.toLocaleString()} mi from budget`}
        </Text>
      </View>
      <View style={styles.cardRight}>
        <Text
          style={[
            styles.tripDistance,
            { color: completed ? theme.colors.textSecondary : theme.colors.textPrimary },
          ]}
          testID={`trip-distance-${trip.id}`}
        >
          {`${trip.distance.toLocaleString()} mi`}
        </Text>
        {completed && (
          <Text
            style={[styles.checkmark, { color: theme.colors.success }]}
            testID={`trip-checkmark-${trip.id}`}
          >
            {'✓'}
          </Text>
        )}
      </View>
    </View>
  );
}

type TripSection = {
  title: string;
  sectionKey: 'active' | 'completed';
  data: SavedTrip[];
};

export function TripListScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<TripsStackNavigationProp>();
  const leases = useLeasesStore(state => state.leases);
  const activeLeaseId = useLeasesStore(state => state.activeLeaseId);
  const setActiveLeaseId = useLeasesStore(state => state.setActiveLeaseId);

  const defaultLeaseId = activeLeaseId ?? leases[0]?.id ?? '';
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>(defaultLeaseId);
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: tripsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['trips', selectedLeaseId],
    queryFn: () => getTrips(selectedLeaseId),
    enabled: selectedLeaseId !== '',
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: getStatus,
  });

  const isPremium = subscriptionData?.isPremium ?? false;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAddTrip = () => {
    navigation.navigate('AddTrip');
  };

  const handleLeaseSelect = (id: string) => {
    setSelectedLeaseId(id);
    setActiveLeaseId(id);
  };

  const activeTrips = tripsData?.active ?? [];
  const completedTrips = tripsData?.completed ?? [];
  const hasTrips = activeTrips.length > 0 || completedTrips.length > 0;

  const sections: TripSection[] = [];
  if (activeTrips.length > 0) {
    sections.push({ title: 'Active', sectionKey: 'active', data: activeTrips });
  }
  if (completedTrips.length > 0) {
    sections.push({ title: 'Completed', sectionKey: 'completed', data: completedTrips });
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="trip-list-screen"
    >
      <ScreenHeader title="Saved Trips" />

      {leases.length > 1 && (
        <LeaseSelectorPills
          leases={leases}
          selectedId={selectedLeaseId}
          onSelect={handleLeaseSelect}
        />
      )}

      {isLoading && (
        <ActivityIndicator
          style={styles.loader}
          size="large"
          color={theme.colors.primary}
          testID="trip-list-loading"
        />
      )}

      {error != null && !isLoading && (
        <ErrorMessage
          message="Failed to load trips."
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && error == null && (
        <>
          {!hasTrips ? (
            <EmptyState
              title="No trips saved."
              subtitle="Plan ahead and save miles for your next trip."
            />
          ) : (
            <SectionList
              testID="trip-list-section-list"
              sections={sections}
              keyExtractor={item => item.id}
              renderItem={({ item, section }) => (
                <TripCard
                  trip={item}
                  completed={(section as TripSection).sectionKey === 'completed'}
                />
              )}
              renderSectionHeader={({ section }) => (
                <View
                  style={[
                    styles.sectionHeader,
                    { backgroundColor: theme.colors.background },
                  ]}
                  testID={`trip-section-${(section as TripSection).sectionKey}`}
                >
                  <Text
                    style={[
                      styles.sectionHeaderText,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {section.title.toUpperCase()}
                  </Text>
                </View>
              )}
              onRefresh={() => { void handleRefresh(); }}
              refreshing={refreshing}
              contentContainerStyle={styles.listContent}
            />
          )}
          <QuickAddFAB onPress={handleAddTrip} testID="trip-list-fab" />
        </>
      )}

      {!isPremium && <BannerAdView />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardLeft: {
    flex: 1,
    marginRight: 12,
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  loader: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tripDate: {
    fontSize: 12,
    marginTop: 2,
  },
  tripDistance: {
    fontSize: 16,
    fontWeight: '600',
  },
  tripImpact: {
    fontSize: 12,
    marginTop: 4,
  },
  tripName: {
    fontSize: 15,
    fontWeight: '500',
  },
});
