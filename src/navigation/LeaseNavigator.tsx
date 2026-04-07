import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LeaseListScreen } from '../screens/leases/LeaseListScreen';
import { AddLeaseScreen } from '../screens/leases/AddLeaseScreen';
import { EditLeaseScreen } from '../screens/leases/EditLeaseScreen';
import { TurnInChecklistScreen } from '../screens/leases/TurnInChecklistScreen';
import type { LeaseStackParamList } from './types';

const Stack = createNativeStackNavigator<LeaseStackParamList>();

export function LeaseNavigator(): React.ReactElement {
  return (
    <Stack.Navigator
      initialRouteName="LeaseList"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="LeaseList" component={LeaseListScreen} />
      <Stack.Screen name="AddLease" component={AddLeaseScreen} />
      <Stack.Screen name="EditLease" component={EditLeaseScreen} />
      <Stack.Screen name="TurnInChecklist" component={TurnInChecklistScreen} />
    </Stack.Navigator>
  );
}
