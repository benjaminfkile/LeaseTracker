import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme';
import type { SavedTrip } from '../types/api';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatTripDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export type TripCardProps = {
  trip: SavedTrip;
  completed?: boolean;
  remainingMiles?: number;
  onMarkComplete?: () => void;
  onPress?: () => void;
  testID?: string;
};

export function TripCard({
  trip,
  completed = false,
  remainingMiles,
  onMarkComplete,
  onPress,
  testID,
}: TripCardProps): React.ReactElement {
  const theme = useTheme();
  const name = trip.name.trim() ? trip.name.trim() : 'Trip';

  const impactText =
    remainingMiles !== undefined
      ? `Uses ${trip.estimated_miles.toLocaleString()} of your ${remainingMiles.toLocaleString()} remaining miles`
      : `\u2212${trip.estimated_miles.toLocaleString()} mi from budget`;

  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.colors.surface,
      borderBottomColor: theme.colors.border,
    },
  ];

  const content = (
    <>
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
          {trip.trip_date != null ? formatTripDate(trip.trip_date) : ''}
        </Text>
        <Text
          style={[styles.tripImpact, { color: theme.colors.textSecondary }]}
          testID={`trip-impact-${trip.id}`}
        >
          {impactText}
        </Text>
        {!completed && onMarkComplete !== undefined && (
          <TouchableOpacity
            onPress={onMarkComplete}
            style={styles.markCompleteButton}
            testID={`trip-mark-complete-${trip.id}`}
            accessibilityRole="button"
            accessibilityLabel="Mark trip as complete"
          >
            <Text style={[styles.markCompleteText, { color: theme.colors.primary }]}>
              {'Mark Complete'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.cardRight}>
        <Text
          style={[
            styles.tripDistance,
            { color: completed ? theme.colors.textSecondary : theme.colors.textPrimary },
          ]}
          testID={`trip-distance-${trip.id}`}
        >
          {`${trip.estimated_miles.toLocaleString()} mi`}
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
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        testID={testID ?? `trip-card-${trip.id}`}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={cardStyle}
      testID={testID ?? `trip-card-${trip.id}`}
    >
      {content}
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
  markCompleteButton: {
    marginTop: 8,
  },
  markCompleteText: {
    fontSize: 13,
    fontWeight: '500',
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
