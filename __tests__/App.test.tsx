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

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    QueryClientProvider: jest.fn(({ children }: { children: React.ReactNode }) =>
      children,
    ),
  };
});

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Linking } from 'react-native';
import App from '../App';
import { useAuthStore } from '../src/stores/authStore';
import BootSplash from 'react-native-bootsplash';

const mockBootSplashHide = BootSplash.hide as jest.Mock;

const mockHydrateFromStorage = jest.fn().mockResolvedValue(undefined);

let mockRemove: jest.Mock;
let mockAddEventListener: jest.SpyInstance;
let mockGetInitialURL: jest.SpyInstance;

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
    mockRemove = jest.fn();
    mockAddEventListener = jest
      .spyOn(Linking, 'addEventListener')
      .mockReturnValue({ remove: mockRemove } as any);
    mockGetInitialURL = jest
      .spyOn(Linking, 'getInitialURL')
      .mockResolvedValue(null);
    setupAuthStoreMock();
  });

  afterEach(() => {
    mockAddEventListener.mockRestore();
    mockGetInitialURL.mockRestore();
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

  it('registers a Linking event listener on mount', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<App />);
    });
    expect(mockAddEventListener).toHaveBeenCalledWith('url', expect.any(Function));
  });

  it('calls Linking.getInitialURL on mount', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<App />);
    });
    expect(mockGetInitialURL).toHaveBeenCalled();
  });

  it('removes the Linking listener on unmount', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
    });
    await ReactTestRenderer.act(async () => {
      renderer!.unmount();
    });
    expect(mockRemove).toHaveBeenCalled();
  });

  it('handles an invite deep link from getInitialURL', async () => {
    mockGetInitialURL.mockResolvedValue('leasetracker://invite/lease-abc');
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<App />);
    });
    expect(mockGetInitialURL).toHaveBeenCalled();
  });

  it('handles a lease deep link from getInitialURL without error', async () => {
    mockGetInitialURL.mockResolvedValue('leasetracker://lease/lease-xyz');
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<App />);
    });
    expect(mockGetInitialURL).toHaveBeenCalled();
  });

  it('invokes the registered url handler when a deep link event fires', async () => {
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<App />);
    });
    const urlHandler = mockAddEventListener.mock.calls[0][1] as (event: {
      url: string;
    }) => void;
    expect(() =>
      urlHandler({ url: 'leasetracker://invite/lease-abc' }),
    ).not.toThrow();
    expect(() =>
      urlHandler({ url: 'leasetracker://lease/lease-xyz' }),
    ).not.toThrow();
  });

  it('wraps the app in QueryClientProvider with correct QueryClient options', async () => {
    const { QueryClientProvider, QueryClient } = require('@tanstack/react-query');
    (QueryClientProvider as jest.Mock).mockClear();
    await ReactTestRenderer.act(async () => {
      ReactTestRenderer.create(<App />);
    });
    expect(QueryClientProvider).toHaveBeenCalled();
    const clientProp = (QueryClientProvider as jest.Mock).mock.calls[0][0].client;
    expect(clientProp).toBeInstanceOf(QueryClient);
    const defaultOptions = clientProp.getDefaultOptions();
    expect(defaultOptions.queries?.staleTime).toBe(60_000);
    expect(defaultOptions.queries?.gcTime).toBe(5 * 60_000);
    expect(defaultOptions.queries?.retry).toBe(1);
  });
});
