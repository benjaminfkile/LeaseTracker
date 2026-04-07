import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function TurnInChecklistScreen(): React.ReactElement {
  return (
    <View style={styles.container} testID="turn-in-checklist-screen">
      <Text testID="turn-in-checklist-title">Turn-In Checklist</Text>
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
