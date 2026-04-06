import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function DashboardScreen(): React.ReactElement {
  return (
    <View style={styles.container} testID="dashboard-screen">
      <Text testID="dashboard-title">Dashboard</Text>
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
