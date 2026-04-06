import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function PaceDetailScreen(): React.ReactElement {
  return (
    <View style={styles.container} testID="pace-detail-screen">
      <Text testID="pace-detail-title">Pace Detail</Text>
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
