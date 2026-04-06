import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PremiumGate } from '../../components/PremiumGate';

export function BuybackAnalysisScreen(): React.ReactElement {
  return (
    <PremiumGate>
      <View style={styles.container} testID="buyback-analysis-screen">
        <Text testID="buyback-analysis-title">Buyback Analysis</Text>
      </View>
    </PremiumGate>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
