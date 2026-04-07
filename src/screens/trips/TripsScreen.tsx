import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function TripsScreen(): React.ReactElement {
  return (
    <View style={styles.container} testID="trips-screen">
      <Text testID="trips-title">Trips</Text>
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
