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

jest.mock('../src/stores/authStore');

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import * as ReactNative from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from '../src/navigation/AuthNavigator';
import { useAuthStore } from '../src/stores/authStore';

function mockAuthStore() {
  const state = {
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    confirmEmail: jest.fn(),
    forgotPassword: jest.fn(),
    confirmReset: jest.fn(),
    refreshTokens: jest.fn(),
    hydrateFromStorage: jest.fn().mockResolvedValue(undefined),
    isLoading: false,
    isAuthenticated: false,
    user: null,
    tokens: null,
    error: null,
  };
  (useAuthStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: typeof state) => unknown) => selector(state),
  );
}

describe('AuthNavigator', () => {
  let useColorSchemeSpy: jest.SpyInstance;

  beforeEach(() => {
    useColorSchemeSpy = jest
      .spyOn(ReactNative, 'useColorScheme')
      .mockReturnValue('light');
    mockAuthStore();
  });

  afterEach(() => {
    useColorSchemeSpy.mockRestore();
  });

  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <NavigationContainer>
          <AuthNavigator />
        </NavigationContainer>,
      );
    });
  });

  it('renders LoginScreen as the initial route', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <NavigationContainer>
          <AuthNavigator />
        </NavigationContainer>,
      );
    });
    const loginTitle = renderer!.root.findByProps({ testID: 'login-title' });
    expect(loginTitle).toBeDefined();
  });
});
