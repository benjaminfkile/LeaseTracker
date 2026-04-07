import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BannerAdView } from '../../components/ads/BannerAdView';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { QuickAddFAB } from '../../components/QuickAddFAB';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useTheme } from '../../theme';
import { deleteReading, getReadings } from '../../api/readingsApi';
import { getStatus } from '../../api/subscriptionApi';
import type { OdometerReading } from '../../types/api';
import type { HomeStackNavigationProp, HomeStackParamList } from '../../navigation/types';

type EnrichedReading = OdometerReading & { delta: number | null };

type ReadingSection = {
  title: string;
  monthKey: string;
  data: EnrichedReading[];
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatMonthYear(dateStr: string): string {
  const d = new Date(dateStr);
  return `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function formatReadingDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${MONTH_NAMES[d.getUTCMonth()].slice(0, 3)} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function buildSections(readings: OdometerReading[]): ReadingSection[] {
  const sorted = [...readings].sort(
    (a, b) => new Date(a.readingDate).getTime() - new Date(b.readingDate).getTime(),
  );

  const enriched: EnrichedReading[] = sorted.map((r, i) => ({
    ...r,
    delta: i === 0 ? null : r.mileage - sorted[i - 1].mileage,
  }));

  const monthMap = new Map<string, EnrichedReading[]>();
  for (const r of enriched) {
    const key = formatMonthYear(r.readingDate);
    if (!monthMap.has(key)) {
      monthMap.set(key, []);
    }
    monthMap.get(key)!.push(r);
  }

  const keys = [...monthMap.keys()].reverse();
  return keys.map(key => {
    const data = [...(monthMap.get(key) ?? [])].reverse();
    const milesInMonth = data.reduce(
      (sum, r) => sum + (r.delta != null && r.delta > 0 ? r.delta : 0),
      0,
    );
    const title =
      milesInMonth > 0
        ? `${key} — ${milesInMonth.toLocaleString()} miles driven`
        : key;
    return { title, monthKey: key, data };
  });
}

type ReadingRowProps = {
  reading: EnrichedReading;
  onDelete: (id: string) => void;
};

function ReadingRow({ reading, onDelete }: ReadingRowProps): React.ReactElement {
  const theme = useTheme();
  const swipeableRef = useRef<Swipeable>(null);

  const handleDeletePress = () => {
    swipeableRef.current?.close();
    Alert.alert(
      'Delete Reading',
      'Are you sure you want to delete this reading?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(reading.id),
        },
      ],
    );
  };

  const renderRightActions = () => (
    <TouchableOpacity
      style={[styles.deleteAction, { backgroundColor: theme.colors.error }]}
      onPress={handleDeletePress}
      accessibilityRole="button"
      accessibilityLabel="Delete reading"
      testID={`reading-delete-action-${reading.id}`}
    >
      <Text style={[styles.deleteText, { color: theme.colors.surface }]}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions}>
      <View
        style={[
          styles.row,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
        testID={`reading-row-${reading.id}`}
      >
        <View style={styles.rowLeft}>
          <Text
            style={[styles.readingDate, { color: theme.colors.textSecondary }]}
            testID={`reading-date-${reading.id}`}
          >
            {formatReadingDate(reading.readingDate)}
          </Text>
          <Text
            style={[styles.readingMileage, { color: theme.colors.textPrimary }]}
            testID={`reading-mileage-${reading.id}`}
          >
            {`${reading.mileage.toLocaleString()} mi`}
          </Text>
        </View>
        <View style={styles.rowRight}>
          {reading.delta != null && (
            <Text
              style={[styles.delta, { color: theme.colors.textSecondary }]}
              testID={`reading-delta-${reading.id}`}
            >
              {`${reading.delta >= 0 ? '+' : ''}${reading.delta.toLocaleString()} mi`}
            </Text>
          )}
          <View
            style={[styles.sourceBadge, { backgroundColor: theme.colors.border }]}
            testID={`reading-source-${reading.id}`}
          >
            <Text style={[styles.sourceBadgeText, { color: theme.colors.textSecondary }]}>
              Manual
            </Text>
          </View>
        </View>
      </View>
    </Swipeable>
  );
}

export function OdometerLogScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<HomeStackNavigationProp>();
  const route = useRoute<RouteProp<HomeStackParamList, 'OdometerLog'>>();
  const { leaseId } = route.params;
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: readings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['readings', leaseId],
    queryFn: () => getReadings(leaseId),
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: getStatus,
  });

  const isPremium = subscriptionData?.isPremium ?? false;

  const { mutate: removeReading } = useMutation({
    mutationFn: (readingId: string) => deleteReading(leaseId, readingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['readings', leaseId] });
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (readingId: string) => {
    removeReading(readingId);
  };

  const handleAddReading = () => {
    navigation.navigate('AddReading', { leaseId });
  };

  const sections = readings ? buildSections(readings) : [];

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="odometer-log-screen"
    >
      <ScreenHeader title="Odometer Log" onBackPress={() => navigation.goBack()} />

      {isLoading && (
        <ActivityIndicator
          style={styles.loader}
          size="large"
          color={theme.colors.primary}
          testID="odometer-log-loading"
        />
      )}

      {error != null && !isLoading && (
        <ErrorMessage
          message="Failed to load odometer readings."
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && error == null && (
        <>
          {sections.length === 0 ? (
            <EmptyState
              title="No readings yet"
              subtitle="Log your first odometer reading to start tracking."
              ctaLabel="Add Reading"
              onCtaPress={handleAddReading}
            />
          ) : (
            <SectionList
              testID="odometer-log-list"
              sections={sections}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <ReadingRow reading={item} onDelete={handleDelete} />
              )}
              renderSectionHeader={({ section }) => (
                <View
                  style={[
                    styles.sectionHeader,
                    { backgroundColor: theme.colors.background },
                  ]}
                  testID={`section-header-${section.monthKey}`}
                >
                  <Text
                    style={[
                      styles.sectionHeaderText,
                      { color: theme.colors.textSecondary },
                    ]}
                    testID="section-header-text"
                  >
                    {section.title}
                  </Text>
                </View>
              )}
              onRefresh={() => { void handleRefresh(); }}
              refreshing={refreshing}
              contentContainerStyle={styles.listContent}
            />
          )}
          <QuickAddFAB onPress={handleAddReading} testID="odometer-log-fab" />
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
  deleteAction: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  deleteText: {
    fontSize: 14,
    fontWeight: '600',
  },
  delta: {
    fontSize: 13,
    marginBottom: 4,
  },
  listContent: {
    flexGrow: 1,
  },
  loader: {
    flex: 1,
  },
  readingDate: {
    fontSize: 12,
    marginBottom: 2,
  },
  readingMileage: {
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: {
    flex: 1,
  },
  rowRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
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
  sourceBadge: {
    borderRadius: 10,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
