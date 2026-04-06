import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function AddReadingScreen(): React.ReactElement {
  return (
    <View style={styles.container} testID="add-reading-screen">
      <Text testID="add-reading-title">Add Reading</Text>
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
