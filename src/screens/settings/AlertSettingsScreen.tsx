import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function AlertSettingsScreen(): React.ReactElement {
  return (
    <View style={styles.container} testID="alert-settings-screen">
      <Text testID="alert-settings-title">Alert Settings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
