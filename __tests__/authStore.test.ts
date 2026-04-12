// Mocks must be declared before imports so they are in place when modules load.
jest.mock('react-native-config', () => ({
  COGNITO_USER_POOL_ID: 'us-east-1_TestPool',
  COGNITO_CLIENT_ID: 'TestClientId',
  AWS_REGION: 'us-east-1',
}));

// All jest.fn() instances are created inside the factory to avoid babel-jest
// hoisting order issues with const declarations.
jest.mock('amazon-cognito-identity-js', () => {
  const poolMethods = {
    signUp: jest.fn(),
    getCurrentUser: jest.fn(),
  };
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
    CognitoUserAttribute: jest.fn(({ Name, Value }: { Name: string; Value: string }) => ({
      Name,
      Value,
    })),
    AuthenticationDetails: jest.fn((data: unknown) => data),
    CognitoRefreshToken: jest.fn((data: unknown) => data),
  };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

import { CognitoUserPool, CognitoUser } from 'amazon-cognito-identity-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../src/stores/authStore';
import { AuthTokens } from '../src/auth/authService';

interface PoolMock {
  signUp: jest.Mock;
  getCurrentUser: jest.Mock;
}
interface UserMock {
  confirmRegistration: jest.Mock;
  authenticateUser: jest.Mock;
  signOut: jest.Mock;
  forgotPassword: jest.Mock;
  confirmPassword: jest.Mock;
  refreshSession: jest.Mock;
  resendConfirmationCode: jest.Mock;
}

type MockedPool = jest.MockedClass<typeof CognitoUserPool> & { __pool: PoolMock };
type MockedUser = jest.MockedClass<typeof CognitoUser> & { __user: UserMock };

const pool = (CognitoUserPool as unknown as MockedPool).__pool;
const user = (CognitoUser as unknown as MockedUser).__user;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

// Helper: build a signed JWT with given payload using base64url encoding.
function buildJwt(payload: object): string {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${header}.${body}.fakesignature`;
}

function futureExp(): number {
  return Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
}

function nearExp(): number {
  return Math.floor(Date.now() / 1000) + 60; // 1 minute from now — below threshold
}

function pastExp(): number {
  return Math.floor(Date.now() / 1000) - 10; // already expired
}

const mockSession = {
  getAccessToken: () => ({
    getJwtToken: () => buildJwt({ sub: 'u1', email: 'test@example.com', exp: futureExp() }),
  }),
  getIdToken: () => ({
    getJwtToken: () =>
      buildJwt({ sub: 'u1', email: 'test@example.com', name: 'Test User' }),
  }),
  getRefreshToken: () => ({ getToken: () => 'refresh-token' }),
};

function makeTokens(accessTokenExp?: number): AuthTokens {
  const exp = accessTokenExp ?? futureExp();
  return {
    accessToken: buildJwt({ sub: 'u1', email: 'test@example.com', exp }),
    idToken: buildJwt({ sub: 'u1', email: 'test@example.com', name: 'Test User' }),
    refreshToken: 'refresh-token',
  };
}

beforeEach(() => {
  // Reset store to initial state between tests
  useAuthStore.setState({
    user: null,
    tokens: null,
    isLoading: false,
    isHydrating: false,
    isAuthenticated: false,
    error: null,
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('authStore', () => {
  describe('initial state', () => {
    it('starts with null user, tokens, and error, not loading, not authenticated', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isHydrating).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('login', () => {
    it('sets isAuthenticated, user, and tokens on success', async () => {
      user.authenticateUser.mockImplementation(
        (_details: unknown, callbacks: { onSuccess: Function }) => {
          callbacks.onSuccess(mockSession);
        },
      );
      mockAsyncStorage.setItem.mockResolvedValue(undefined as never);

      await useAuthStore.getState().login('test@example.com', 'Password1!');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).not.toBeNull();
      expect(state.user?.email).toBe('test@example.com');
      expect(state.tokens).not.toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('stores tokens in AsyncStorage on success', async () => {
      user.authenticateUser.mockImplementation(
        (_details: unknown, callbacks: { onSuccess: Function }) => {
          callbacks.onSuccess(mockSession);
        },
      );
      mockAsyncStorage.setItem.mockResolvedValue(undefined as never);

      await useAuthStore.getState().login('test@example.com', 'Password1!');

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@auth_tokens',
        expect.any(String),
      );
    });

    it('sets error and does not authenticate on failure', async () => {
      const error = new Error('NotAuthorizedException');
      user.authenticateUser.mockImplementation(
        (_details: unknown, callbacks: { onFailure: Function }) => {
          callbacks.onFailure(error);
        },
      );

      await expect(
        useAuthStore.getState().login('test@example.com', 'wrong'),
      ).rejects.toThrow('NotAuthorizedException');

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('NotAuthorizedException');
      expect(state.isLoading).toBe(false);
    });

    it('sets isLoading to false after failure', async () => {
      user.authenticateUser.mockImplementation(
        (_details: unknown, callbacks: { onFailure: Function }) => {
          callbacks.onFailure(new Error('Fail'));
        },
      );

      await expect(useAuthStore.getState().login('a@b.com', 'pw')).rejects.toThrow();

      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('clears auth state on success', async () => {
      // Pre-populate state
      useAuthStore.setState({
        user: { sub: 'u1', email: 'test@example.com' },
        tokens: makeTokens(),
        isAuthenticated: true,
      });

      pool.getCurrentUser.mockReturnValue({ signOut: jest.fn() });
      mockAsyncStorage.removeItem.mockResolvedValue(undefined as never);

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets error on failure and rethrows', async () => {
      pool.getCurrentUser.mockImplementation(() => {
        throw new Error('SignOutFailed');
      });

      await expect(useAuthStore.getState().logout()).rejects.toThrow('SignOutFailed');

      const state = useAuthStore.getState();
      expect(state.error).toBe('SignOutFailed');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('completes without error on success', async () => {
      const fakeUser = { getUsername: () => 'test@example.com' };
      pool.signUp.mockImplementation(
        (_u: string, _p: string, _a: unknown[], _v: unknown[], cb: Function) => {
          cb(null, { user: fakeUser });
        },
      );

      await useAuthStore.getState().register('test@example.com', 'Password1!', 'Test');

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('sets error on failure and rethrows', async () => {
      pool.signUp.mockImplementation(
        (_u: string, _p: string, _a: unknown[], _v: unknown[], cb: Function) => {
          cb(new Error('UsernameExistsException'), null);
        },
      );

      await expect(
        useAuthStore.getState().register('test@example.com', 'Password1!', 'Test'),
      ).rejects.toThrow('UsernameExistsException');

      expect(useAuthStore.getState().error).toBe('UsernameExistsException');
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('confirmEmail', () => {
    it('resolves on success', async () => {
      user.confirmRegistration.mockImplementation(
        (_code: string, _force: boolean, cb: Function) => {
          cb(null, 'SUCCESS');
        },
      );

      await expect(
        useAuthStore.getState().confirmEmail('test@example.com', '123456'),
      ).resolves.toBeUndefined();

      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('sets error on failure and rethrows', async () => {
      user.confirmRegistration.mockImplementation(
        (_code: string, _force: boolean, cb: Function) => {
          cb(new Error('CodeMismatchException'));
        },
      );

      await expect(
        useAuthStore.getState().confirmEmail('test@example.com', '000000'),
      ).rejects.toThrow('CodeMismatchException');

      expect(useAuthStore.getState().error).toBe('CodeMismatchException');
    });
  });

  describe('forgotPassword', () => {
    it('resolves on success', async () => {
      user.forgotPassword.mockImplementation((callbacks: { onSuccess: Function }) => {
        callbacks.onSuccess({});
      });

      await expect(
        useAuthStore.getState().forgotPassword('test@example.com'),
      ).resolves.toBeUndefined();

      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('sets error on failure and rethrows', async () => {
      user.forgotPassword.mockImplementation((callbacks: { onFailure: Function }) => {
        callbacks.onFailure(new Error('UserNotFoundException'));
      });

      await expect(
        useAuthStore.getState().forgotPassword('test@example.com'),
      ).rejects.toThrow('UserNotFoundException');

      expect(useAuthStore.getState().error).toBe('UserNotFoundException');
    });
  });

  describe('confirmReset', () => {
    it('resolves on success', async () => {
      user.confirmPassword.mockImplementation(
        (_code: string, _pw: string, callbacks: { onSuccess: Function }) => {
          callbacks.onSuccess('SUCCESS');
        },
      );

      await expect(
        useAuthStore.getState().confirmReset('test@example.com', '123456', 'NewPassword1!'),
      ).resolves.toBeUndefined();

      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('sets error on failure and rethrows', async () => {
      user.confirmPassword.mockImplementation(
        (_code: string, _pw: string, callbacks: { onFailure: Function }) => {
          callbacks.onFailure(new Error('ExpiredCodeException'));
        },
      );

      await expect(
        useAuthStore.getState().confirmReset('test@example.com', '000000', 'NewPassword1!'),
      ).rejects.toThrow('ExpiredCodeException');

      expect(useAuthStore.getState().error).toBe('ExpiredCodeException');
    });
  });

  describe('refreshTokens', () => {
    it('updates tokens and user on success', async () => {
      const oldTokens = makeTokens();
      useAuthStore.setState({ tokens: oldTokens, isAuthenticated: true });

      const newSession = {
        getAccessToken: () => ({
          getJwtToken: () =>
            buildJwt({ sub: 'u1', email: 'test@example.com', exp: futureExp() }),
        }),
        getIdToken: () => ({
          getJwtToken: () =>
            buildJwt({ sub: 'u1', email: 'test@example.com', name: 'Updated Name' }),
        }),
        getRefreshToken: () => ({ getToken: () => 'new-refresh-token' }),
      };

      const mockRefresh = jest.fn();
      pool.getCurrentUser.mockReturnValue({ refreshSession: mockRefresh });
      mockRefresh.mockImplementation((_token: unknown, cb: Function) => {
        cb(null, newSession);
      });
      mockAsyncStorage.setItem.mockResolvedValue(undefined as never);

      await useAuthStore.getState().refreshTokens();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.tokens?.refreshToken).toBe('new-refresh-token');
      expect(state.isLoading).toBe(false);
    });

    it('does nothing when no tokens are stored', async () => {
      useAuthStore.setState({ tokens: null });

      await useAuthStore.getState().refreshTokens();

      expect(pool.getCurrentUser).not.toHaveBeenCalled();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('sets error when refresh fails and rethrows', async () => {
      useAuthStore.setState({ tokens: makeTokens(), isAuthenticated: true });

      pool.getCurrentUser.mockReturnValue(null);

      await expect(useAuthStore.getState().refreshTokens()).rejects.toThrow('No current user');

      expect(useAuthStore.getState().error).toBe('No current user');
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('hydrateFromStorage', () => {
    it('does nothing when no tokens are in storage', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null as never);

      await useAuthStore.getState().hydrateFromStorage();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.isHydrating).toBe(false);
      expect(state.user).toBeNull();
    });

    it('hydrates state from valid, non-expired tokens without refreshing', async () => {
      const tokens = makeTokens(futureExp());
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify(tokens) as never,
      );

      await useAuthStore.getState().hydrateFromStorage();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.tokens).toEqual(tokens);
      expect(state.user?.email).toBe('test@example.com');
      expect(state.isLoading).toBe(false);
      expect(state.isHydrating).toBe(false);
      // should NOT have called refreshSession
      expect(pool.getCurrentUser).not.toHaveBeenCalled();
    });

    it('silently refreshes tokens when they are near expiry', async () => {
      const nearExpiryTokens = makeTokens(nearExp());
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify(nearExpiryTokens) as never,
      );

      const mockRefresh = jest.fn();
      pool.getCurrentUser.mockReturnValue({ refreshSession: mockRefresh });
      mockRefresh.mockImplementation((_token: unknown, cb: Function) => {
        cb(null, mockSession);
      });
      mockAsyncStorage.setItem.mockResolvedValue(undefined as never);

      await useAuthStore.getState().hydrateFromStorage();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.isHydrating).toBe(false);
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('silently refreshes tokens when they are already expired', async () => {
      const expiredTokens = makeTokens(pastExp());
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify(expiredTokens) as never,
      );

      const mockRefresh = jest.fn();
      pool.getCurrentUser.mockReturnValue({ refreshSession: mockRefresh });
      mockRefresh.mockImplementation((_token: unknown, cb: Function) => {
        cb(null, mockSession);
      });
      mockAsyncStorage.setItem.mockResolvedValue(undefined as never);

      await useAuthStore.getState().hydrateFromStorage();

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('clears storage and stays unauthenticated when silent refresh fails', async () => {
      const expiredTokens = makeTokens(pastExp());
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify(expiredTokens) as never,
      );

      pool.getCurrentUser.mockReturnValue(null); // causes refreshSession to reject
      mockAsyncStorage.removeItem.mockResolvedValue(undefined as never);

      await useAuthStore.getState().hydrateFromStorage();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.isHydrating).toBe(false);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@auth_tokens');
    });

    it('sets error when getStoredTokens itself throws', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(
        new Error('StorageReadError') as never,
      );

      await useAuthStore.getState().hydrateFromStorage();

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.isHydrating).toBe(false);
      expect(state.error).toBe('StorageReadError');
      expect(state.isAuthenticated).toBe(false);
    });
  });
});
