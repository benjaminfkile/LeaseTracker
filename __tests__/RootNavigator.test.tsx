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

jest.mock('../src/navigation/AppNavigator', () => ({
  AppNavigator: () => null,
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import * as ReactNative from 'react-native';
import { RootNavigator, linking } from '../src/navigation/RootNavigator';
import { useAuthStore } from '../src/stores/authStore';

type AuthStoreState = {
  login: jest.Mock;
  logout: jest.Mock;
  register: jest.Mock;
  confirmEmail: jest.Mock;
  forgotPassword: jest.Mock;
  confirmReset: jest.Mock;
  refreshTokens: jest.Mock;
  hydrateFromStorage: jest.Mock;
  isLoading: boolean;
  isHydrating: boolean;
  isAuthenticated: boolean;
  user: null;
  tokens: null;
  error: null;
};

function mockAuthStore(overrides: Partial<AuthStoreState> = {}) {
  const state: AuthStoreState = {
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    confirmEmail: jest.fn(),
    forgotPassword: jest.fn(),
    confirmReset: jest.fn(),
    refreshTokens: jest.fn(),
    hydrateFromStorage: jest.fn().mockResolvedValue(undefined),
    isLoading: false,
    isHydrating: false,
    isAuthenticated: false,
    user: null,
    tokens: null,
    error: null,
    ...overrides,
  };
  (useAuthStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: AuthStoreState) => unknown) => selector(state),
  );
}

describe('RootNavigator', () => {
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
      ReactTestRenderer.create(<RootNavigator />);
    });
  });

  it('renders LoginScreen as the initial screen when not authenticated', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<RootNavigator />);
    });
    const loginTitle = renderer!.root.findByProps({ testID: 'login-title' });
    expect(loginTitle).toBeDefined();
  });

  it('renders the splash indicator while isHydrating is true', async () => {
    mockAuthStore({ isHydrating: true });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<RootNavigator />);
    });
    const splash = renderer!.root.findByProps({ testID: 'root-splash' });
    expect(splash).toBeDefined();
    const indicator = renderer!.root.findByProps({ testID: 'root-splash-indicator' });
    expect(indicator).toBeDefined();
  });

  it('does not render NavigationContainer while isHydrating is true', async () => {
    mockAuthStore({ isHydrating: true });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<RootNavigator />);
    });
    expect(() => renderer!.root.findByProps({ testID: 'login-title' })).toThrow();
  });

  it('renders AppNavigator when isAuthenticated is true', async () => {
    mockAuthStore({ isAuthenticated: true });
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<RootNavigator />);
    });
    expect(() => renderer!.root.findByProps({ testID: 'login-title' })).toThrow();
  });
});

describe('linking config', () => {
  it('uses the leasetracker:// scheme as prefix', () => {
    expect(linking.prefixes).toContain('leasetracker://');
  });

  it('maps invite/:leaseId to the LeaseList screen', () => {
    const leasesScreens = (linking.config?.screens as any).Leases?.screens;
    expect(leasesScreens?.LeaseList).toBe('invite/:leaseId');
  });

  it('maps lease/:leaseId to the LeaseDetail screen', () => {
    const homeScreens = (linking.config?.screens as any).Home?.screens;
    expect(homeScreens?.LeaseDetail).toBe('lease/:leaseId');
  });
});
