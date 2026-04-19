import React, { useState } from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BannerAdView } from '../../components/ads/BannerAdView';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { LeaseSelectorPills } from '../../components/LeaseSelectorPills';
import { QuickAddFAB } from '../../components/QuickAddFAB';
import { ScreenHeader } from '../../components/ScreenHeader';
import { TripCard } from '../../components/TripCard';
import { getLeaseSummary } from '../../api/leaseApi';
import { getTrips, updateTrip } from '../../api/tripsApi';
import { getStatus } from '../../api/subscriptionApi';
import { useLeasesStore } from '../../stores/leasesStore';
import { useTheme } from '../../theme';
import type { SavedTrip } from '../../types/api';
import type { TripsStackNavigationProp } from '../../navigation/types';

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
  const queryClient = useQueryClient();

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

  const { data: summaryData } = useQuery({
    queryKey: ['lease-summary', selectedLeaseId],
    queryFn: () => getLeaseSummary(selectedLeaseId),
    enabled: selectedLeaseId !== '',
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: getStatus,
  });

  const { mutate: markComplete } = useMutation({
    mutationFn: (tripId: string) =>
      updateTrip(selectedLeaseId, tripId, { is_completed: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['trips', selectedLeaseId] });
    },
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
              renderItem={({ item, section }) => {
                const isCompleted = (section as TripSection).sectionKey === 'completed';
                return (
                  <TripCard
                    trip={item}
                    completed={isCompleted}
                    remainingMiles={summaryData?.milesRemaining}
                    onMarkComplete={isCompleted ? undefined : () => markComplete(item.id)}
                    onPress={() =>
                      navigation.navigate('EditTrip', {
                        tripId: item.id,
                        leaseId: selectedLeaseId,
                      })
                    }
                  />
                );
              }}
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
});
