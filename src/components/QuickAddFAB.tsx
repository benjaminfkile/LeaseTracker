import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { palette, useTheme } from '../theme';

export type QuickAddFABProps = {
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
};

export function QuickAddFAB({
  onPress,
  disabled = false,
  testID = 'quick-add-fab',
}: QuickAddFABProps): React.ReactElement {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        { backgroundColor: theme.colors.primary },
        Platform.OS === 'android' ? styles.elevationAndroid : styles.shadowIos,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Log odometer reading"
      accessibilityState={{ disabled }}
      testID={testID}
    >
      <Text style={styles.icon} testID={`${testID}-icon`}>
        {'+'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
  elevationAndroid: {
    elevation: 6,
  },
  fab: {
    alignItems: 'center',
    borderRadius: 28,
    bottom: 24,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: 24,
    width: 56,
    zIndex: 999,
  },
  icon: {
    color: palette.white,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
  shadowIos: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});
