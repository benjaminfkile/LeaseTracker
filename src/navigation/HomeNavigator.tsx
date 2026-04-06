import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/home/DashboardScreen';
import { LeaseDetailScreen } from '../screens/home/LeaseDetailScreen';
import { OdometerLogScreen } from '../screens/home/OdometerLogScreen';
import { AddReadingScreen } from '../screens/home/AddReadingScreen';
import { PaceDetailScreen } from '../screens/home/PaceDetailScreen';
import { BuybackAnalysisScreen } from '../screens/home/BuybackAnalysisScreen';
import { LeaseEndOptionsScreen } from '../screens/home/LeaseEndOptionsScreen';
import type { HomeStackParamList } from './types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeNavigator(): React.ReactElement {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="LeaseDetail" component={LeaseDetailScreen} />
      <Stack.Screen name="OdometerLog" component={OdometerLogScreen} />
      <Stack.Screen name="AddReading" component={AddReadingScreen} />
      <Stack.Screen name="PaceDetail" component={PaceDetailScreen} />
      <Stack.Screen name="BuybackAnalysis" component={BuybackAnalysisScreen} />
      <Stack.Screen name="LeaseEndOptions" component={LeaseEndOptionsScreen} />
    </Stack.Navigator>
  );
}
