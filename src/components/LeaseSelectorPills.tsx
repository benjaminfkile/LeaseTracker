import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import type { Lease } from '../types/api';
import { useTheme } from '../theme';

export type LeaseSelectorPillsProps = {
  leases: Lease[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function LeaseSelectorPills({
  leases,
  selectedId,
  onSelect,
}: LeaseSelectorPillsProps): React.ReactElement {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      testID="lease-selector-pills"
    >
      {leases.map(lease => {
        const isSelected = lease.id === selectedId;
        const label = `${lease.year} ${lease.make} ${lease.model}`;

        return (
          <TouchableOpacity
            key={lease.id}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected
                  ? theme.colors.primary
                  : theme.colors.surface,
                borderColor: isSelected
                  ? theme.colors.primary
                  : theme.colors.border,
              },
            ]}
            onPress={() => onSelect(lease.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={label}
            testID={`lease-pill-${lease.id}`}
          >
            <Text
              style={[
                styles.pillLabel,
                {
                  color: isSelected
                    ? theme.colors.surface
                    : theme.colors.textPrimary,
                },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pill: {
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
});
