import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';

type Props = {
  children: React.ReactNode;
  isPremium?: boolean;
  onUpgrade?: () => void;
  description?: string;
};

export function PremiumGate({ children, isPremium, onUpgrade, description }: Props): React.ReactElement {
  const theme = useTheme();

  if (isPremium === false) {
    return (
      <View
        style={[styles.lockedContainer, { backgroundColor: theme.colors.background }]}
        testID="premium-gate-locked"
      >
        <Text style={styles.lockIcon}>{'🔒'}</Text>
        <Text
          style={[styles.title, { color: theme.colors.textPrimary }]}
          testID="premium-gate-title"
        >
          {'Premium Feature'}
        </Text>
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          {description ?? 'Unlock this feature and more with Premium.'}
        </Text>
        <TouchableOpacity
          style={[styles.upgradeButton, { backgroundColor: theme.colors.primary }]}
          onPress={onUpgrade}
          testID="premium-gate-upgrade-button"
          accessibilityRole="button"
          accessibilityLabel="Unlock with Premium"
        >
          <Text style={[styles.upgradeButtonText, { color: theme.colors.surface }]}>
            {'Unlock with Premium'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 32,
    marginHorizontal: 32,
    textAlign: 'center',
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  lockedContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  upgradeButton: {
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
