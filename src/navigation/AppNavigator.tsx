import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { HomeNavigator } from './HomeNavigator';
import { LeaseNavigator } from './LeaseNavigator';
import { TripsNavigator } from './TripsNavigator';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { useLeasesStore } from '../stores/leasesStore';
import type { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppNavigator(): React.ReactElement {
  const overPaceCount = useLeasesStore(state => state.overPaceCount);

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard" size={size} color={color} />
          ),
          tabBarBadge: overPaceCount > 0 ? overPaceCount : undefined,
        }}
      />
      <Tab.Screen
        name="Leases"
        component={LeaseNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="car" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Trips"
        component={TripsNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="map" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
