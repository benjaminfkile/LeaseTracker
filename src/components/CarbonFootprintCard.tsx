import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import type { Lease } from '../types/api';

const EPA_CO2_FACTOR = 19.6; // lbs CO₂ per gallon of gasoline
const TREE_ABSORPTION_LBS_PER_YEAR = 48; // lbs CO₂ absorbed per mature tree per year

type CarbonFootprintCardProps = {
  lease: Lease;
  testID?: string;
};

function computeCarbonStats(lease: Lease) {
  const currentOdometer = lease.current_odometer ?? lease.starting_odometer;
  const milesDriven = currentOdometer - lease.starting_odometer;
  const mpg = 0;

  if (mpg <= 0 || milesDriven <= 0) {
    return null;
  }

  const co2Lbs = (milesDriven / mpg) * EPA_CO2_FACTOR;
  const treesNeeded = co2Lbs / TREE_ABSORPTION_LBS_PER_YEAR;
  const gallonsUsed = milesDriven / mpg;

  return {
    milesDriven,
    co2Lbs: Math.round(co2Lbs),
    treesNeeded: Math.max(treesNeeded, 0.1),
    gallonsUsed: Math.round(gallonsUsed),
    mpg,
  };
}

export function CarbonFootprintCard({
  lease,
  testID = 'carbon-footprint-card',
}: CarbonFootprintCardProps): React.ReactElement | null {
  const theme = useTheme();
  const stats = computeCarbonStats(lease);

  if (stats == null) {
    return null;
  }

  const treesLabel =
    stats.treesNeeded >= 1
      ? `${Math.round(stats.treesNeeded)} mature tree${Math.round(stats.treesNeeded) !== 1 ? 's' : ''}`
      : 'less than 1 tree';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
      testID={testID}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.headerEmoji]}>{'🌿'}</Text>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          {'Carbon Footprint'}
        </Text>
        <Text style={[styles.headerBadge, { color: theme.colors.success }]}>{'Fun Fact'}</Text>
      </View>

      <View style={styles.statRow} testID="carbon-co2-stat">
        <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
          {`${stats.co2Lbs.toLocaleString()} lbs`}
        </Text>
        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
          {'CO\u2082 produced'}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      <View style={styles.equivalentsSection} testID="carbon-equivalents">
        <Text style={[styles.equivalentsTitle, { color: theme.colors.textSecondary }]}>
          {"That's equivalent to..."}
        </Text>

        <View style={styles.equivalentRow} testID="carbon-trees-equivalent">
          <Text style={styles.equivalentIcon}>{'🌳'}</Text>
          <Text style={[styles.equivalentText, { color: theme.colors.textPrimary }]}>
            {`${treesLabel} needed to absorb for a year`}
          </Text>
        </View>

        <View style={styles.equivalentRow} testID="carbon-gallons-equivalent">
          <Text style={styles.equivalentIcon}>{'⛽'}</Text>
          <Text style={[styles.equivalentText, { color: theme.colors.textPrimary }]}>
            {`${stats.gallonsUsed.toLocaleString()} gallons of gas burned`}
          </Text>
        </View>

        <View style={styles.equivalentRow} testID="carbon-miles-equivalent">
          <Text style={styles.equivalentIcon}>{'🚗'}</Text>
          <Text style={[styles.equivalentText, { color: theme.colors.textPrimary }]}>
            {`${stats.milesDriven.toLocaleString()} miles driven at ${stats.mpg} MPG`}
          </Text>
        </View>
      </View>

      <Text style={[styles.footnote, { color: theme.colors.textSecondary }]}>
        {'Based on EPA factor of 19.6 lbs CO\u2082 per gallon'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  equivalentIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 24,
    textAlign: 'center',
  },
  equivalentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },
  equivalentText: {
    flex: 1,
    fontSize: 14,
  },
  equivalentsSection: {
    marginBottom: 4,
  },
  equivalentsTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  footnote: {
    fontSize: 11,
    marginTop: 8,
    textAlign: 'center',
  },
  headerBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  statRow: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
});
