import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function AccountScreen(): React.ReactElement {
  return (
    <View style={styles.container} testID="account-screen">
      <Text testID="account-title">Account</Text>
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
