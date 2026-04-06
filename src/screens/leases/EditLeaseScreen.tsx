import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function EditLeaseScreen(): React.ReactElement {
  return (
    <View style={styles.container} testID="edit-lease-screen">
      <Text testID="edit-lease-title">Edit Lease</Text>
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
