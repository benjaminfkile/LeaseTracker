// Mocks must be declared before imports so they are available when the
// authService module is first loaded (it creates a CognitoUserPool at module
// scope, so the mock must be in place before the import resolves).
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
import {
  signUp,
  confirmSignUp,
  signIn,
  signOut,
  forgotPassword,
  confirmForgotPassword,
  refreshSession,
  resendConfirmationCode,
  getStoredTokens,
  storeTokens,
  clearTokens,
  decodeIdToken,
  AuthTokens,
} from '../src/auth/authService';

// Typed references to the shared mock objects attached to the constructors.
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

const mockSession = {
  getAccessToken: () => ({ getJwtToken: () => 'access-token' }),
  getIdToken: () => ({ getJwtToken: () => 'id-token' }),
  getRefreshToken: () => ({ getToken: () => 'refresh-token' }),
};

const expectedTokens: AuthTokens = {
  accessToken: 'access-token',
  idToken: 'id-token',
  refreshToken: 'refresh-token',
};

afterEach(() => {
  jest.clearAllMocks();
});

describe('authService', () => {
  describe('signUp', () => {
    it('resolves with the new CognitoUser on success', async () => {
      const fakeUser = { getUsername: () => 'test@example.com' };
      pool.signUp.mockImplementation(
        (_u: string, _p: string, _a: unknown[], _v: unknown[], cb: Function) => {
          cb(null, { user: fakeUser });
        },
      );

      const result = await signUp('test@example.com', 'Password1!', 'Test User');
      expect(result).toBe(fakeUser);
      expect(pool.signUp).toHaveBeenCalledTimes(1);
    });

    it('rejects when Cognito returns an error', async () => {
      const error = new Error('UsernameExistsException');
      pool.signUp.mockImplementation(
        (_u: string, _p: string, _a: unknown[], _v: unknown[], cb: Function) => {
          cb(error, null);
        },
      );

      await expect(signUp('test@example.com', 'Password1!', 'Test User')).rejects.toThrow(
        'UsernameExistsException',
      );
    });

    it('rejects with a fallback error when result is missing', async () => {
      pool.signUp.mockImplementation(
        (_u: string, _p: string, _a: unknown[], _v: unknown[], cb: Function) => {
          cb(null, null);
        },
      );

      await expect(signUp('test@example.com', 'Password1!', 'Test User')).rejects.toThrow(
        'Sign up failed',
      );
    });
  });

  describe('confirmSignUp', () => {
    it('resolves on success', async () => {
      user.confirmRegistration.mockImplementation(
        (_code: string, _force: boolean, cb: Function) => {
          cb(null, 'SUCCESS');
        },
      );

      await expect(confirmSignUp('test@example.com', '123456')).resolves.toBeUndefined();
    });

    it('rejects on error', async () => {
      const error = new Error('CodeMismatchException');
      user.confirmRegistration.mockImplementation(
        (_code: string, _force: boolean, cb: Function) => {
          cb(error);
        },
      );

      await expect(confirmSignUp('test@example.com', '000000')).rejects.toThrow(
        'CodeMismatchException',
      );
    });
  });

  describe('signIn', () => {
    it('resolves with tokens on success', async () => {
      user.authenticateUser.mockImplementation(
        (_details: unknown, callbacks: { onSuccess: Function }) => {
          callbacks.onSuccess(mockSession);
        },
      );

      const tokens = await signIn('test@example.com', 'Password1!');
      expect(tokens).toEqual(expectedTokens);
    });

    it('rejects on authentication failure', async () => {
      const error = new Error('NotAuthorizedException');
      user.authenticateUser.mockImplementation(
        (_details: unknown, callbacks: { onFailure: Function }) => {
          callbacks.onFailure(error);
        },
      );

      await expect(signIn('test@example.com', 'wrong')).rejects.toThrow(
        'NotAuthorizedException',
      );
    });
  });

  describe('signOut', () => {
    it('calls user.signOut and clears stored tokens when a current user exists', async () => {
      const mockLocalSignOut = jest.fn();
      pool.getCurrentUser.mockReturnValue({ signOut: mockLocalSignOut });
      mockAsyncStorage.removeItem.mockResolvedValue(undefined as never);

      await signOut();

      expect(mockLocalSignOut).toHaveBeenCalledTimes(1);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@auth_tokens');
    });

    it('still clears stored tokens when no current user exists', async () => {
      pool.getCurrentUser.mockReturnValue(null);
      mockAsyncStorage.removeItem.mockResolvedValue(undefined as never);

      await signOut();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@auth_tokens');
    });
  });

  describe('forgotPassword', () => {
    it('resolves on success', async () => {
      user.forgotPassword.mockImplementation((callbacks: { onSuccess: Function }) => {
        callbacks.onSuccess({});
      });

      await expect(forgotPassword('test@example.com')).resolves.toBeUndefined();
    });

    it('rejects on error', async () => {
      const error = new Error('UserNotFoundException');
      user.forgotPassword.mockImplementation((callbacks: { onFailure: Function }) => {
        callbacks.onFailure(error);
      });

      await expect(forgotPassword('test@example.com')).rejects.toThrow(
        'UserNotFoundException',
      );
    });
  });

  describe('confirmForgotPassword', () => {
    it('resolves on success', async () => {
      user.confirmPassword.mockImplementation(
        (_code: string, _pw: string, callbacks: { onSuccess: Function }) => {
          callbacks.onSuccess('SUCCESS');
        },
      );

      await expect(
        confirmForgotPassword('test@example.com', '123456', 'NewPassword1!'),
      ).resolves.toBeUndefined();
    });

    it('rejects on error', async () => {
      const error = new Error('ExpiredCodeException');
      user.confirmPassword.mockImplementation(
        (_code: string, _pw: string, callbacks: { onFailure: Function }) => {
          callbacks.onFailure(error);
        },
      );

      await expect(
        confirmForgotPassword('test@example.com', '000000', 'NewPassword1!'),
      ).rejects.toThrow('ExpiredCodeException');
    });
  });

  describe('refreshSession', () => {
    it('resolves with new tokens on success', async () => {
      const mockRefresh = jest.fn();
      pool.getCurrentUser.mockReturnValue({ refreshSession: mockRefresh });
      mockRefresh.mockImplementation((_token: unknown, cb: Function) => {
        cb(null, mockSession);
      });

      const tokens = await refreshSession('old-refresh-token');
      expect(tokens).toEqual(expectedTokens);
    });

    it('rejects when there is no current user', async () => {
      pool.getCurrentUser.mockReturnValue(null);

      await expect(refreshSession('old-refresh-token')).rejects.toThrow('No current user');
    });

    it('rejects on Cognito error', async () => {
      const mockRefresh = jest.fn();
      pool.getCurrentUser.mockReturnValue({ refreshSession: mockRefresh });
      const error = new Error('NotAuthorizedException');
      mockRefresh.mockImplementation((_token: unknown, cb: Function) => {
        cb(error, null);
      });

      await expect(refreshSession('bad-token')).rejects.toThrow('NotAuthorizedException');
    });

    it('rejects with fallback error when session is missing', async () => {
      const mockRefresh = jest.fn();
      pool.getCurrentUser.mockReturnValue({ refreshSession: mockRefresh });
      mockRefresh.mockImplementation((_token: unknown, cb: Function) => {
        cb(null, null);
      });

      await expect(refreshSession('bad-token')).rejects.toThrow('Session refresh failed');
    });
  });

  describe('resendConfirmationCode', () => {
    it('resolves on success', async () => {
      user.resendConfirmationCode.mockImplementation((cb: Function) => {
        cb(null, 'SUCCESS');
      });

      await expect(resendConfirmationCode('test@example.com')).resolves.toBeUndefined();
    });

    it('rejects on error', async () => {
      const error = new Error('LimitExceededException');
      user.resendConfirmationCode.mockImplementation((cb: Function) => {
        cb(error);
      });

      await expect(resendConfirmationCode('test@example.com')).rejects.toThrow(
        'LimitExceededException',
      );
    });
  });

  describe('getStoredTokens', () => {
    it('returns parsed tokens when they exist in AsyncStorage', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(
        JSON.stringify(expectedTokens) as never,
      );

      const result = await getStoredTokens();
      expect(result).toEqual(expectedTokens);
      expect(mockAsyncStorage.getItem).toHaveBeenCalledWith('@auth_tokens');
    });

    it('returns null when no tokens are stored', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null as never);

      const result = await getStoredTokens();
      expect(result).toBeNull();
    });
  });

  describe('storeTokens', () => {
    it('serialises and saves tokens to AsyncStorage', async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined as never);

      await storeTokens(expectedTokens);

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@auth_tokens',
        JSON.stringify(expectedTokens),
      );
    });
  });

  describe('clearTokens', () => {
    it('removes the tokens key from AsyncStorage', async () => {
      mockAsyncStorage.removeItem.mockResolvedValue(undefined as never);

      await clearTokens();

      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('@auth_tokens');
    });
  });

  describe('decodeIdToken', () => {
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

    it('decodes standard JWT claims correctly', () => {
      const claims = { sub: 'user-123', email: 'test@example.com', name: 'Test User' };
      const jwt = buildJwt(claims);

      const result = decodeIdToken(jwt);

      expect(result.sub).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('Test User');
    });

    it('handles base64url encoding (- and _ characters)', () => {
      // Build a payload whose base64-encoded form contains + or / characters,
      // which would be replaced with - and _ in base64url encoding.
      const claims = { sub: 'user-123', email: 'edge@example.com', padding: 'xyzxyz' };
      const jwt = buildJwt(claims);

      const result = decodeIdToken(jwt);
      expect(result.sub).toBe('user-123');
      expect(result.email).toBe('edge@example.com');
    });

    it('throws when the token does not have three parts', () => {
      expect(() => decodeIdToken('not.a.valid.jwt.token')).toThrow('Invalid JWT format');
      expect(() => decodeIdToken('onlyone')).toThrow('Invalid JWT format');
    });

    it('preserves arbitrary additional claims', () => {
      const claims = {
        sub: 'u1',
        email: 'a@b.com',
        'custom:plan': 'premium',
        exp: 9999999999,
      };
      const jwt = buildJwt(claims);
      const result = decodeIdToken(jwt);
      expect(result['custom:plan']).toBe('premium');
      expect(result.exp).toBe(9999999999);
    });
  });
});
