import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme';

export type ErrorMessageProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorMessage({
  message,
  onRetry,
  retryLabel = 'Retry',
}: ErrorMessageProps): React.ReactElement {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.error,
        },
      ]}
      testID="error-message"
      accessibilityRole="alert"
    >
      <View style={styles.row}>
        <Text
          style={[styles.icon, { color: theme.colors.error }]}
          testID="error-message-icon"
        >
          {'⚠'}
        </Text>
        <Text
          style={[styles.message, { color: theme.colors.textPrimary }]}
          testID="error-message-text"
        >
          {message}
        </Text>
      </View>

      {onRetry != null && (
        <TouchableOpacity
          onPress={onRetry}
          style={styles.retryButton}
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
          testID="error-message-retry"
        >
          <Text
            style={[styles.retryLabel, { color: theme.colors.primary }]}
            testID="error-message-retry-label"
          >
            {retryLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
  },
  icon: {
    fontSize: 16,
    marginRight: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 2,
  },
  retryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
});
