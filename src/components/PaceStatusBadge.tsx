import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

export type PaceStatus = 'on-track' | 'slightly-over' | 'over-pace';

export type PaceStatusBadgeProps = {
  status: PaceStatus;
};

const STATUS_CONFIG: Record<
  PaceStatus,
  { label: string; icon: string; colorKey: 'success' | 'warning' | 'error' }
> = {
  'on-track': { label: 'On Track', icon: '✓', colorKey: 'success' },
  'slightly-over': { label: 'Slightly Over', icon: '!', colorKey: 'warning' },
  'over-pace': { label: 'Over Pace', icon: '⚠', colorKey: 'error' },
};

export function PaceStatusBadge({
  status,
}: PaceStatusBadgeProps): React.ReactElement {
  const theme = useTheme();
  const { label, icon, colorKey } = STATUS_CONFIG[status];
  const color = theme.colors[colorKey];

  return (
    <View
      style={[styles.badge, { backgroundColor: `${color}20`, borderColor: color }]}
      testID="pace-status-badge"
      accessibilityRole="text"
      accessibilityLabel={`Pace status: ${label}`}
    >
      <Text style={[styles.icon, { color }]} testID="pace-status-badge-icon">
        {icon}
      </Text>
      <Text
        style={[styles.label, { color }]}
        testID="pace-status-badge-label"
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
