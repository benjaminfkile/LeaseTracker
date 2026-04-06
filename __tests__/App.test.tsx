/**
 * @format
 */

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

jest.mock('../src/navigation/RootNavigator', () => ({
  RootNavigator: () => null,
}));

jest.mock('../src/stores/authStore');

jest.mock('react-native-bootsplash', () => ({
  __esModule: true,
  default: { hide: jest.fn().mockResolvedValue(undefined) },
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import { useAuthStore } from '../src/stores/authStore';
import BootSplash from 'react-native-bootsplash';

const mockBootSplashHide = BootSplash.hide as jest.Mock;

const mockHydrateFromStorage = jest.fn().mockResolvedValue(undefined);

function setupAuthStoreMock() {
  const state = {
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    confirmEmail: jest.fn(),
    forgotPassword: jest.fn(),
    confirmReset: jest.fn(),
    refreshTokens: jest.fn(),
    hydrateFromStorage: mockHydrateFromStorage,
    resendCode: jest.fn(),
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

describe('App', () => {
  beforeEach(() => {
    mockHydrateFromStorage.mockReset().mockResolvedValue(undefined);
    mockBootSplashHide.mockReset().mockResolvedValue(undefined);
    setupAuthStoreMock();
  });

  it('renders correctly', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<App />);
    });
  });

  it('calls hydrateFromStorage on mount', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<App />);
    });
    expect(mockHydrateFromStorage).toHaveBeenCalledTimes(1);
  });

  it('hides the bootsplash after hydration resolves', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<App />);
    });
    expect(mockBootSplashHide).toHaveBeenCalledWith({ fade: true });
  });
});
