import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function AddLeaseScreen(): React.ReactElement {
  return (
    <View style={styles.container} testID="add-lease-screen">
      <Text testID="add-lease-title">Add Lease</Text>
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
