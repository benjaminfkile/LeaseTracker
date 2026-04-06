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

export function ReadingImpactCard({
  lease,
  currentMileage,
  newMileage,
  testID,
}: ReadingImpactCardProps): React.ReactElement {
  const theme = useTheme();

  const isValid = newMileage != null && newMileage > currentMileage;
  const milesAdded = isValid ? newMileage - currentMileage : null;
  const startingMileage = lease?.startingMileage ?? 0;
  const totalMiles = lease?.totalMiles ?? 0;
  const milesUsed = isValid
    ? newMileage - startingMileage
    : currentMileage - startingMileage;
  const milesRemaining = totalMiles > 0 ? totalMiles - milesUsed : null;

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
        <View style={styles.statsRow} testID="reading-impact-stats">
          <View style={styles.stat}>
            <Text
              style={[styles.statValue, { color: theme.colors.success }]}
              testID="reading-impact-miles-added"
            >
              {`+${milesAdded!.toLocaleString()} mi`}
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
