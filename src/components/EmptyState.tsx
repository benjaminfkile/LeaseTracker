import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { Button } from './Button';

export type EmptyStateProps = {
  title: string;
  subtitle?: string;
  illustration?: React.ReactNode;
  ctaLabel?: string;
  onCtaPress?: () => void;
};

export function EmptyState({
  title,
  subtitle,
  illustration,
  ctaLabel,
  onCtaPress,
}: EmptyStateProps): React.ReactElement {
  const theme = useTheme();

  const hasCta = ctaLabel != null && onCtaPress != null;

  return (
    <View style={styles.container} testID="empty-state">
      <View style={styles.illustrationWrapper} testID="empty-state-illustration">
        {illustration != null ? (
          illustration
        ) : (
          <View
            style={[
              styles.illustrationPlaceholder,
              { backgroundColor: theme.colors.border },
            ]}
            testID="empty-state-illustration-placeholder"
          />
        )}
      </View>

      <Text
        style={[styles.title, { color: theme.colors.textPrimary }]}
        testID="empty-state-title"
      >
        {title}
      </Text>

      {subtitle != null && (
        <Text
          style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          testID="empty-state-subtitle"
        >
          {subtitle}
        </Text>
      )}

      {hasCta && (
        <View style={styles.ctaWrapper} testID="empty-state-cta">
          <Button title={ctaLabel} onPress={onCtaPress} variant="primary" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  ctaWrapper: {
    alignSelf: 'stretch',
    marginTop: 24,
  },
  illustrationPlaceholder: {
    borderRadius: 48,
    height: 96,
    width: 96,
  },
  illustrationWrapper: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
});
