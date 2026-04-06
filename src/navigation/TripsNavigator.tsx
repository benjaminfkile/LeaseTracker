import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TripListScreen } from '../screens/trips/TripListScreen';
import { AddTripScreen } from '../screens/trips/AddTripScreen';
import { EditTripScreen } from '../screens/trips/EditTripScreen';
import type { TripsStackParamList } from './types';

const Stack = createNativeStackNavigator<TripsStackParamList>();

export function TripsNavigator(): React.ReactElement {
  return (
    <Stack.Navigator
      initialRouteName="TripList"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="TripList" component={TripListScreen} />
      <Stack.Screen name="AddTrip" component={AddTripScreen} />
      <Stack.Screen name="EditTrip" component={EditTripScreen} />
    </Stack.Navigator>
  );
}
