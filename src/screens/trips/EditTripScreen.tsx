import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function EditTripScreen(): React.ReactElement {
  return (
    <View style={styles.container} testID="edit-trip-screen">
      <Text testID="edit-trip-title">Edit Trip</Text>
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
