import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function OdometerLogScreen(): React.ReactElement {
  return (
    <View style={styles.container} testID="odometer-log-screen">
      <Text testID="odometer-log-title">Odometer Log</Text>
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
