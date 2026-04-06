import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function LeaseListScreen(): React.ReactElement {
  return (
    <View style={styles.container} testID="lease-list-screen">
      <Text testID="lease-list-title">Lease List</Text>
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
