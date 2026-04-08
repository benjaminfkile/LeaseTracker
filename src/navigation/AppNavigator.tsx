import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { HomeNavigator } from './HomeNavigator';
import { LeaseNavigator } from './LeaseNavigator';
import { TripsNavigator } from './TripsNavigator';
import { SettingsNavigator } from './SettingsNavigator';
import { useLeasesStore } from '../stores/leasesStore';
import { useTheme } from '../theme';
import type { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppNavigator(): React.ReactElement {
  const overPaceCount = useLeasesStore(state => state.overPaceCount);
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      }}>
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
        component={SettingsNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
