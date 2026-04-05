import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme';

export type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

type ErrorFallbackProps = {
  error: Error | null;
  onReset: () => void;
};

function ErrorFallback({
  error,
  onReset,
}: ErrorFallbackProps): React.ReactElement {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="error-boundary-container"
      accessibilityRole="alert"
    >
      <Text
        style={[styles.title, { color: theme.colors.error }]}
        testID="error-boundary-title"
      >
        {'Something went wrong'}
      </Text>

      {error != null && (
        <Text
          style={[styles.message, { color: theme.colors.textSecondary }]}
          testID="error-boundary-message"
          numberOfLines={3}
        >
          {error.message}
        </Text>
      )}

      <TouchableOpacity
        onPress={onReset}
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel="Try again"
        testID="error-boundary-reset"
      >
        <Text
          style={[styles.buttonLabel, { color: theme.colors.surface }]}
          testID="error-boundary-reset-label"
        >
          {'Try again'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  handleReset(): void {
    this.setState({ hasError: false, error: null });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback != null) {
        return this.props.fallback;
      }
      return (
        <ErrorFallback error={this.state.error} onReset={this.handleReset} />
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
});
