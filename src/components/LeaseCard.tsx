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

export type LeaseCardProps = {
  lease: Lease;
  onArchive: (id: string) => void;
  onPress?: (id: string) => void;
  testID?: string;
};

export function LeaseCard({
  lease,
  onArchive,
  onPress,
  testID,
}: LeaseCardProps): React.ReactElement {
  const theme = useTheme();
  const swipeableRef = useRef<Swipeable>(null);

  const baseLabel = `${lease.vehicleYear} ${lease.vehicleMake} ${lease.vehicleModel}`;
  const vehicleLabel = lease.vehicleTrim ? `${baseLabel} ${lease.vehicleTrim}` : baseLabel;

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
        <Text
          style={[styles.vehicleLabel, { color: theme.colors.textPrimary }]}
          testID="lease-card-vehicle-label"
          numberOfLines={1}
        >
          {vehicleLabel}
        </Text>

        <View style={styles.statsRow}>
          <Text
            style={[styles.statText, { color: theme.colors.textSecondary }]}
            testID="lease-card-mileage"
          >
            {`${lease.currentMileage.toLocaleString()} / ${lease.totalMiles.toLocaleString()} mi`}
          </Text>

          <Text
            style={[styles.statText, { color: theme.colors.textSecondary }]}
            testID="lease-card-monthly"
          >
            {`${lease.monthlyMiles.toLocaleString()} mi/mo`}
          </Text>
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
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  statText: {
    fontSize: 13,
  },
  vehicleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
