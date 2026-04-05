import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../theme';

export type ScreenHeaderProps = {
  title: string;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
};

export function ScreenHeader({
  title,
  onBackPress,
  rightAction,
}: ScreenHeaderProps): React.ReactElement {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}
    >
      <View style={styles.left}>
        {onBackPress != null && (
          <TouchableOpacity
            onPress={onBackPress}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            testID="screen-header-back-button"
          >
            <Text style={[styles.backIcon, { color: theme.colors.primary }]}>{'←'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text
        style={[styles.title, { color: theme.colors.textPrimary }]}
        numberOfLines={1}
        testID="screen-header-title"
      >
        {title}
      </Text>

      <View style={styles.right}>
        {rightAction != null && (
          <View testID="screen-header-right-action">{rightAction}</View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  backIcon: {
    fontSize: 32,
    lineHeight: 32,
  },
  container: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    height: 56,
    paddingHorizontal: 16,
  },
  left: {
    alignItems: 'flex-start',
    width: 48,
  },
  right: {
    alignItems: 'flex-end',
    width: 48,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
