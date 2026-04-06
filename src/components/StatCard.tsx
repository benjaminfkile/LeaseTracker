import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

export type StatCardProps = {
  label: string;
  value: string | number;
  unit?: string;
  testID?: string;
};

export function StatCard({
  label,
  value,
  unit,
  testID = 'stat-card',
}: StatCardProps): React.ReactElement {
  const theme = useTheme();

  return (
    <View style={styles.container} testID={testID}>
      <Text
        style={[styles.value, { color: theme.colors.textPrimary }]}
        testID={`${testID}-value`}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {unit != null && (
        <Text
          style={[styles.unit, { color: theme.colors.textSecondary }]}
          testID={`${testID}-unit`}
        >
          {unit}
        </Text>
      )}
      <Text
        style={[styles.label, { color: theme.colors.textSecondary }]}
        testID={`${testID}-label`}
        numberOfLines={2}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  label: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  unit: {
    fontSize: 12,
    marginTop: 1,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
});
