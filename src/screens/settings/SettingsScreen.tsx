import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function SettingsScreen(): React.ReactElement {
  return (
    <View style={styles.container} testID="settings-screen">
      <Text testID="settings-title">Settings</Text>
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
