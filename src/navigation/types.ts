import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
};

export type AppTabParamList = {
  Home: undefined;
  Leases: undefined;
  Trips: undefined;
  Settings: undefined;
};

export type AppStackParamList = Record<string, undefined>;

export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type AppNavigationProp = NativeStackNavigationProp<AppStackParamList>;
export type AppTabNavigationProp = BottomTabNavigationProp<AppTabParamList>;
