import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useTheme } from '../theme';
import type { Lease } from '../types/api';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

type PaceStatus = 'on-track' | 'slightly-over' | 'over-pace';

const PACE_CONFIG: Record<PaceStatus, { label: string; colorKey: 'success' | 'warning' | 'error' }> = {
  'on-track': { label: 'On Track', colorKey: 'success' },
  'slightly-over': { label: 'Slightly Over', colorKey: 'warning' },
  'over-pace': { label: 'Over Pace', colorKey: 'error' },
};

function computePaceStatus(lease: Lease): PaceStatus {
  const today = Date.now();
  const start = new Date(lease.lease_start_date).getTime();
  const end = new Date(lease.lease_end_date).getTime();
  const totalDays = Math.max(1, (end - start) / MS_PER_DAY);
  const elapsedDays = Math.max(0, (today - start) / MS_PER_DAY);
  const currentOdometer = lease.current_odometer ?? lease.starting_odometer;
  const milesUsed = currentOdometer - lease.starting_odometer;
  const expectedMiles = (elapsedDays / totalDays) * lease.total_miles_allowed;
  if (milesUsed > expectedMiles * 1.1) {
    return 'over-pace';
  }
  if (milesUsed > expectedMiles) {
    return 'slightly-over';
  }
  return 'on-track';
}

export type LeaseCardProps = {
  lease: Lease;
  onArchive: (id: string) => void;
  onPress?: (id: string) => void;
  isShared?: boolean;
  testID?: string;
};

export function LeaseCard({
  lease,
  onArchive,
  onPress,
  isShared = false,
  testID,
}: LeaseCardProps): React.ReactElement {
  const theme = useTheme();
  const swipeableRef = useRef<Swipeable>(null);

  const vehicleLabel = lease.display_name;

  const currentOdometer = lease.current_odometer ?? lease.starting_odometer;
  const milesUsed = currentOdometer - lease.starting_odometer;
  const progressRatio = Math.min(1, Math.max(0, milesUsed / lease.total_miles_allowed));

  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(lease.lease_end_date).getTime() - Date.now()) / MS_PER_DAY),
  );

  const paceStatus = computePaceStatus(lease);
  const { label: paceLabel, colorKey } = PACE_CONFIG[paceStatus];
  const paceColor = theme.colors[colorKey];

  const renderRightActions = () => (
    <TouchableOpacity
      style={[styles.archiveAction, { backgroundColor: theme.colors.warning }]}
      onPress={() => {
        swipeableRef.current?.close();
        onArchive(lease.id);
      }}
      accessibilityRole="button"
      accessibilityLabel="Archive lease"
      testID="lease-card-archive-action"
    >
      <Text style={[styles.archiveText, { color: theme.colors.surface }]}>
        Archive
      </Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions}>
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => onPress?.(lease.id)}
        activeOpacity={0.7}
        testID={testID ?? 'lease-card'}
      >
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text
            style={[styles.vehicleLabel, { color: theme.colors.textPrimary }]}
            testID="lease-card-vehicle-label"
            numberOfLines={1}
          >
            {vehicleLabel}
          </Text>
          {isShared && (
            <View
              style={[styles.sharedBadge, { backgroundColor: theme.colors.primary }]}
              testID="lease-card-shared-badge"
            >
              <Text style={[styles.sharedBadgeText, { color: theme.colors.surface }]}>
                Shared
              </Text>
            </View>
          )}
        </View>

        {/* Progress bar */}
        <View
          style={[styles.progressTrack, { backgroundColor: theme.colors.border }]}
          testID="lease-card-progress-bar"
        >
          <View
            style={[
              styles.progressFill,
              { flex: progressRatio, backgroundColor: paceColor },
            ]}
          />
          {progressRatio < 1 && <View style={{ flex: 1 - progressRatio }} />}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <Text
            style={[styles.statText, { color: theme.colors.textSecondary }]}
            testID="lease-card-mileage"
          >
            {`${milesUsed.toLocaleString()} / ${lease.total_miles_allowed.toLocaleString()} mi`}
          </Text>
          <Text
            style={[styles.statText, { color: theme.colors.textSecondary }]}
            testID="lease-card-monthly"
          >
            {`${lease.miles_per_year.toLocaleString()} mi/yr`}
          </Text>
        </View>

        {/* Chip row */}
        <View style={styles.chipRow}>
          <View
            style={[styles.chip, { borderColor: theme.colors.border }]}
            testID="lease-card-days-left"
          >
            <Text style={[styles.chipText, { color: theme.colors.textSecondary }]}>
              {`${daysRemaining} days left`}
            </Text>
          </View>
          <View
            style={[styles.chip, { borderColor: paceColor }]}
            testID="lease-card-pace-chip"
          >
            <Text style={[styles.chipText, { color: paceColor }]}>
              {paceLabel}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  archiveAction: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 0,
    paddingHorizontal: 20,
  },
  archiveText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chip: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  progressFill: {
    borderRadius: 2,
    height: 4,
  },
  progressTrack: {
    borderRadius: 2,
    flexDirection: 'row',
    height: 4,
    marginTop: 10,
    overflow: 'hidden',
  },
  sharedBadge: {
    borderRadius: 10,
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sharedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  statText: {
    fontSize: 13,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  vehicleLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
});
