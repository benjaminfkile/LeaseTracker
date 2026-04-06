import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
};

export type HomeStackParamList = {
  Dashboard: undefined;
  LeaseDetail: { leaseId: string };
  OdometerLog: { leaseId: string };
  AddReading: { leaseId: string };
  PaceDetail: { leaseId: string };
  BuybackAnalysis: { leaseId: string };
};

export type AppTabParamList = {
  Home: undefined;
  Leases: undefined;
  Trips: undefined;
  Settings: undefined;
};

export type LeaseStackParamList = {
  LeaseList: undefined;
  AddLease: undefined;
  EditLease: { leaseId: string };
  TurnInChecklist: { leaseId: string };
};

export type TripsStackParamList = {
  TripList: undefined;
  AddTrip: undefined;
  EditTrip: { tripId: string };
};

export type AppStackParamList = Record<string, undefined>;

export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;
export type AppNavigationProp = NativeStackNavigationProp<AppStackParamList>;
export type AppTabNavigationProp = BottomTabNavigationProp<AppTabParamList>;
export type HomeStackNavigationProp = NativeStackNavigationProp<HomeStackParamList>;
export type LeaseStackNavigationProp = NativeStackNavigationProp<LeaseStackParamList>;
export type TripsStackNavigationProp = NativeStackNavigationProp<TripsStackParamList>;
