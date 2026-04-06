import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function LeaseDetailScreen(): React.ReactElement {
  return (
    <View style={styles.container} testID="lease-detail-screen">
      <Text testID="lease-detail-title">Lease Detail</Text>
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
