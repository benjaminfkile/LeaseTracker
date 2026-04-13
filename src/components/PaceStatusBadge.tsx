import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

export type PaceStatus = 'ahead' | 'on_track' | 'behind';

export type PaceStatusBadgeProps = {
  status: PaceStatus;
};

const STATUS_CONFIG: Record<
  PaceStatus,
  { label: string; icon: string; colorKey: 'success' | 'warning' | 'error' }
> = {
  ahead: { label: 'Over Pace', icon: '⚠', colorKey: 'error' },
  on_track: { label: 'On Track', icon: '✓', colorKey: 'success' },
  behind: { label: 'Under Pace', icon: '✓', colorKey: 'success' },
};

export function PaceStatusBadge({
  status,
}: PaceStatusBadgeProps): React.ReactElement {
  const theme = useTheme();
  const { label, icon, colorKey } = STATUS_CONFIG[status];
  const color = theme.colors[colorKey];

  return (
    <View
      style={[styles.badge, { borderColor: color }]}
      testID="pace-status-badge"
      accessibilityRole="text"
      accessibilityLabel={`Pace status: ${label}`}
    >
      {/* Tinted background that works with any color format */}
      <View style={[StyleSheet.absoluteFill, styles.badgeBg, { backgroundColor: color }]} />
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
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  badgeBg: {
    borderRadius: 20,
    opacity: 0.12,
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
