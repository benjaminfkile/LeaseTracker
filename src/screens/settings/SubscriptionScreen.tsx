import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function SubscriptionScreen(): React.ReactElement {
  return (
    <View style={styles.container} testID="subscription-screen">
      <Text testID="subscription-title">Subscription</Text>
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
