import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function TripListScreen(): React.ReactElement {
  return (
    <View style={styles.container} testID="trip-list-screen">
      <Text testID="trip-list-title">Trip List</Text>
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
