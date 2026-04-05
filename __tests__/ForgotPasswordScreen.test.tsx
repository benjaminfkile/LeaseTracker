jest.mock('react-native-config', () => ({
  COGNITO_USER_POOL_ID: 'us-east-1_TestPool',
  COGNITO_CLIENT_ID: 'TestClientId',
  AWS_REGION: 'us-east-1',
}));

jest.mock('amazon-cognito-identity-js', () => {
  const poolMethods = { signUp: jest.fn(), getCurrentUser: jest.fn() };
  const userMethods = {
    confirmRegistration: jest.fn(),
    authenticateUser: jest.fn(),
    signOut: jest.fn(),
    forgotPassword: jest.fn(),
    confirmPassword: jest.fn(),
    refreshSession: jest.fn(),
    resendConfirmationCode: jest.fn(),
  };
  const MockCognitoUserPool = jest.fn(() => poolMethods);
  (MockCognitoUserPool as any).__pool = poolMethods;
  const MockCognitoUser = jest.fn(() => userMethods);
  (MockCognitoUser as any).__user = userMethods;
  return {
    CognitoUserPool: MockCognitoUserPool,
    CognitoUser: MockCognitoUser,
    CognitoUserAttribute: jest.fn(),
    AuthenticationDetails: jest.fn((data: unknown) => data),
    CognitoRefreshToken: jest.fn((data: unknown) => data),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import * as ReactNative from 'react-native';
import { ForgotPasswordScreen } from '../src/screens/auth/ForgotPasswordScreen';
import type { AuthStackParamList } from '../src/navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  setOptions: jest.fn(),
  isFocused: jest.fn(),
  canGoBack: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  removeListener: jest.fn(),
  getId: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
} as unknown as NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const mockRoute = {
  key: 'ForgotPassword',
  name: 'ForgotPassword' as const,
  params: undefined,
} as RouteProp<AuthStackParamList, 'ForgotPassword'>;

describe('ForgotPasswordScreen', () => {
  let useColorSchemeSpy: jest.SpyInstance;

  beforeEach(() => {
    useColorSchemeSpy = jest
      .spyOn(ReactNative, 'useColorScheme')
      .mockReturnValue('light');
  });

  afterEach(() => {
    useColorSchemeSpy.mockRestore();
  });

  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <ForgotPasswordScreen navigation={mockNavigation} route={mockRoute} />,
      );
    });
  });

  it('has forgot-password-screen testID', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ForgotPasswordScreen navigation={mockNavigation} route={mockRoute} />,
      );
    });
    const screen = renderer!.root.findByProps({
      testID: 'forgot-password-screen',
    });
    expect(screen).toBeDefined();
  });

  it('renders without crashing in dark mode', async () => {
    useColorSchemeSpy.mockReturnValue('dark');
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <ForgotPasswordScreen navigation={mockNavigation} route={mockRoute} />,
      );
    });
  });
});
