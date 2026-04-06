import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function AboutScreen(): React.ReactElement {
  return (
    <View style={styles.container} testID="about-screen">
      <Text testID="about-title">About</Text>
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
