import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function AddTripScreen(): React.ReactElement {
  return (
    <View style={styles.container} testID="add-trip-screen">
      <Text testID="add-trip-title">Add Trip</Text>
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
