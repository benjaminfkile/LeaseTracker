import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function HomeScreen(): React.ReactElement {
  return (
    <View style={styles.container} testID="home-screen">
      <Text testID="home-title">Home</Text>
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
