import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './Card';
import { useTheme } from '../theme';
import type { Lease } from '../types/api';

export type ReadingImpactCardProps = {
  lease: Lease | undefined;
  currentMileage: number;
  newMileage: number | null;
  testID?: string;
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function computeExpectedMileage(lease: Lease): number {
  const today = Date.now();
  const start = new Date(lease.lease_start_date).getTime();
  const end = new Date(lease.lease_end_date).getTime();
  const totalDays = Math.max(1, (end - start) / MS_PER_DAY);
  const elapsedDays = Math.max(0, (today - start) / MS_PER_DAY);
  return lease.starting_odometer + (elapsedDays / totalDays) * lease.total_miles_allowed;
}

export function ReadingImpactCard({
  lease,
  currentMileage,
  newMileage,
  testID,
}: ReadingImpactCardProps): React.ReactElement {
  const theme = useTheme();

  const isValid = newMileage != null && newMileage > currentMileage;
  const milesAdded = isValid ? newMileage - currentMileage : null;
  const startingMileage = lease?.starting_odometer ?? 0;
  const totalMiles = lease?.total_miles_allowed ?? 0;
  const milesUsed = isValid
    ? newMileage - startingMileage
    : currentMileage - startingMileage;
  const milesRemaining = totalMiles > 0 ? totalMiles - milesUsed : null;

  const expectedMileage = lease != null ? computeExpectedMileage(lease) : null;
  const paceDelta =
    isValid && expectedMileage != null
      ? Math.round(expectedMileage - newMileage)
      : null;
  const paceColor =
    paceDelta == null || paceDelta < 0 ? theme.colors.error : theme.colors.success;
  const paceMessage =
    paceDelta == null
      ? null
      : paceDelta === 0
        ? "After this entry you'll be exactly on pace →"
        : paceDelta > 0
          ? `After this entry you'll be ${paceDelta.toLocaleString()} miles ahead of pace ↑`
          : `After this entry you'll be ${Math.abs(paceDelta).toLocaleString()} miles behind pace ↓`;

  return (
    <Card testID={testID ?? 'reading-impact-card'}>
      <Text
        style={[styles.cardTitle, { color: theme.colors.textPrimary }]}
        testID="reading-impact-title"
      >
        Reading Impact
      </Text>

      {!isValid ? (
        <Text
          style={[styles.placeholder, { color: theme.colors.textSecondary }]}
          testID="reading-impact-placeholder"
        >
          Enter a mileage above to see the impact
        </Text>
      ) : (
        <>
          <View style={styles.statsRow} testID="reading-impact-stats">
            <View style={styles.stat}>
              <Text
                style={[styles.statValue, { color: theme.colors.success }]}
                testID="reading-impact-miles-added"
              >
                {`+${(milesAdded ?? 0).toLocaleString()} mi`}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Miles Added
              </Text>
            </View>

            <View
              style={[styles.divider, { backgroundColor: theme.colors.border }]}
            />

            <View style={styles.stat}>
              <Text
                style={[styles.statValue, { color: theme.colors.textPrimary }]}
                testID="reading-impact-miles-used"
              >
                {`${milesUsed.toLocaleString()} mi`}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                Miles Used
              </Text>
            </View>

            {milesRemaining != null && (
              <>
                <View
                  style={[styles.divider, { backgroundColor: theme.colors.border }]}
                />
                <View style={styles.stat}>
                  <Text
                    style={[
                      styles.statValue,
                      {
                        color:
                          milesRemaining < 0
                            ? theme.colors.error
                            : theme.colors.textPrimary,
                      },
                    ]}
                    testID="reading-impact-miles-remaining"
                  >
                    {`${milesRemaining.toLocaleString()} mi`}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Remaining
                  </Text>
                </View>
              </>
            )}
          </View>

          {paceMessage != null && (
            <Text
              style={[styles.paceMessage, { color: paceColor }]}
              testID="reading-impact-pace-message"
            >
              {paceMessage}
            </Text>
          )}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  divider: {
    alignSelf: 'stretch',
    width: StyleSheet.hairlineWidth,
  },
  paceMessage: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  placeholder: {
    fontSize: 14,
    textAlign: 'center',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
