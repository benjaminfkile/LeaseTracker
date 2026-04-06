// Mocks must be declared before imports so they are in place when modules load.
jest.mock('react-native-config', () => ({
  COGNITO_USER_POOL_ID: 'us-east-1_TestPool',
  COGNITO_CLIENT_ID: 'TestClientId',
  AWS_REGION: 'us-east-1',
  API_BASE_URL: 'https://api.test.com',
}));

// All jest.fn() instances are created inside the factory to avoid babel-jest
// hoisting order issues with const declarations.
jest.mock('../src/auth/authService', () => ({
  refreshSession: jest.fn(),
  storeTokens: jest.fn(),
  decodeIdToken: jest.fn(),
}));

jest.mock('../src/stores/authStore', () => {
  const useAuthStore = jest.fn() as jest.Mock & {
    getState: jest.Mock;
    setState: jest.Mock;
  };
  useAuthStore.getState = jest.fn();
  useAuthStore.setState = jest.fn();
  return { useAuthStore };
});

import axios, { AxiosError, AxiosHeaders } from 'axios';
import * as authService from '../src/auth/authService';
import { useAuthStore } from '../src/stores/authStore';
import client from '../src/api/client';

const mockTokens = {
  idToken: 'old-id-token',
  accessToken: 'old-access-token',
  refreshToken: 'old-refresh-token',
};

const newMockTokens = {
  idToken: 'new-id-token',
  accessToken: 'new-access-token',
  refreshToken: 'new-refresh-token',
};

const mockUser = { sub: 'user-123', email: 'test@example.com' };

type StoreState = {
  tokens: typeof mockTokens | null;
  user: typeof mockUser | null;
  isAuthenticated: boolean;
  logout: jest.Mock;
};

let storeState: StoreState;

function getInterceptorHandler(type: 'request' | 'response') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client.interceptors[type] as any).handlers.find((h: any) => h !== null);
}

function makeConfig(overrides: Record<string, unknown> = {}) {
  return {
    headers: new AxiosHeaders(),
    url: '/test',
    method: 'get',
    ...overrides,
  };
}

function make401Error(config: ReturnType<typeof makeConfig>) {
  const err = new AxiosError('Unauthorized', 'ERR_BAD_RESPONSE', config as never);
  err.response = {
    status: 401,
    statusText: 'Unauthorized',
    data: {},
    headers: {},
    config: config as never,
  };
  return err;
}

beforeEach(() => {
  jest.clearAllMocks();

  storeState = {
    tokens: { ...mockTokens },
    user: null,
    isAuthenticated: false,
    logout: jest.fn().mockResolvedValue(undefined),
  };

  (useAuthStore.getState as jest.Mock).mockImplementation(() => storeState);
  (useAuthStore.setState as jest.Mock).mockImplementation(
    (partial: Partial<StoreState> | ((s: StoreState) => Partial<StoreState>)) => {
      const update = typeof partial === 'function' ? partial(storeState) : partial;
      Object.assign(storeState, update);
    },
  );

  (authService.refreshSession as jest.Mock).mockResolvedValue(newMockTokens);
  (authService.storeTokens as jest.Mock).mockResolvedValue(undefined);
  (authService.decodeIdToken as jest.Mock).mockReturnValue(mockUser);

  // Default adapter: succeed on retry (call count > 1), fail with 401 on first call
  client.defaults.adapter = jest.fn().mockResolvedValue({
    data: { success: true },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: makeConfig(),
  });
});

// ─── Request interceptor ────────────────────────────────────────────────────

describe('request interceptor', () => {
  it('attaches Authorization header when idToken is present', async () => {
    const handler = getInterceptorHandler('request');
    const config = makeConfig();
    const result = await handler.fulfilled(config);
    expect(result.headers.get('Authorization')).toBe('Bearer old-id-token');
  });

  it('does not attach Authorization header when tokens are null', async () => {
    storeState.tokens = null;
    const handler = getInterceptorHandler('request');
    const config = makeConfig();
    const result = await handler.fulfilled(config);
    expect(result.headers.get('Authorization')).toBeFalsy();
  });

  it('passes through request config unchanged for non-auth properties', async () => {
    const handler = getInterceptorHandler('request');
    const config = makeConfig({ url: '/leases', method: 'post', data: { foo: 'bar' } });
    const result = await handler.fulfilled(config);
    expect(result.url).toBe('/leases');
    expect(result.method).toBe('post');
    expect((result as { data?: unknown }).data).toEqual({ foo: 'bar' });
  });

  it('forwards errors from the request pipeline', async () => {
    const handler = getInterceptorHandler('request');
    const err = new Error('network error');
    await expect(handler.rejected(err)).rejects.toThrow('network error');
  });
});

// ─── Response interceptor ───────────────────────────────────────────────────

describe('response interceptor', () => {
  it('passes through successful responses unchanged', async () => {
    const handler = getInterceptorHandler('response');
    const response = { status: 200, data: { ok: true } };
    const result = await handler.fulfilled(response);
    expect(result).toBe(response);
  });

  it('passes through non-401 errors without refreshing', async () => {
    const handler = getInterceptorHandler('response');
    const config = makeConfig();
    const err = new AxiosError('Server Error', 'ERR_BAD_RESPONSE', config as never);
    err.response = { status: 500, statusText: 'Internal Server Error', data: {}, headers: {}, config: config as never };

    await expect(handler.rejected(err)).rejects.toThrow();
    expect(authService.refreshSession).not.toHaveBeenCalled();
  });

  it('does not retry a request already marked with _retry', async () => {
    const handler = getInterceptorHandler('response');
    const config = makeConfig({ _retry: true });
    const err = make401Error(config);

    await expect(handler.rejected(err)).rejects.toThrow();
    expect(authService.refreshSession).not.toHaveBeenCalled();
  });

  it('passes through 401 error without config', async () => {
    const handler = getInterceptorHandler('response');
    const err = new AxiosError('Unauthorized');
    err.response = { status: 401, statusText: 'Unauthorized', data: {}, headers: {}, config: undefined as never };
    // config is undefined

    await expect(handler.rejected(err)).rejects.toThrow();
    expect(authService.refreshSession).not.toHaveBeenCalled();
  });

  it('refreshes tokens and retries original request on 401', async () => {
    const handler = getInterceptorHandler('response');
    const config = makeConfig();
    const err = make401Error(config);

    const result = await handler.rejected(err);

    expect(authService.refreshSession).toHaveBeenCalledWith(mockTokens.refreshToken);
    expect(authService.storeTokens).toHaveBeenCalledWith(newMockTokens);
    expect(authService.decodeIdToken).toHaveBeenCalledWith(newMockTokens.idToken);
    expect(useAuthStore.setState).toHaveBeenCalledWith({
      tokens: newMockTokens,
      user: mockUser,
      isAuthenticated: true,
    });
    expect(result.status).toBe(200);
  });

  it('sets Authorization header to new idToken on retry', async () => {
    const handler = getInterceptorHandler('response');
    const config = makeConfig();
    const err = make401Error(config);

    await handler.rejected(err);

    const mockAdapter = client.defaults.adapter as jest.Mock;
    const retryConfig = mockAdapter.mock.calls[0][0] as { headers: AxiosHeaders };
    expect(retryConfig.headers.get('Authorization')).toBe(`Bearer ${newMockTokens.idToken}`);
  });

  it('calls logout and rejects when no refresh token is available', async () => {
    storeState.tokens = null;
    const handler = getInterceptorHandler('response');
    const config = makeConfig();
    const err = make401Error(config);

    await expect(handler.rejected(err)).rejects.toThrow();
    expect(storeState.logout).toHaveBeenCalled();
    expect(authService.refreshSession).not.toHaveBeenCalled();
  });

  it('calls logout and rejects when refresh session fails', async () => {
    const refreshError = new Error('Refresh failed');
    (authService.refreshSession as jest.Mock).mockRejectedValue(refreshError);

    const handler = getInterceptorHandler('response');
    const config = makeConfig();
    const err = make401Error(config);

    await expect(handler.rejected(err)).rejects.toThrow('Refresh failed');
    expect(storeState.logout).toHaveBeenCalled();
  });

  it('queues concurrent 401 requests and resolves them after a single refresh', async () => {
    const handler = getInterceptorHandler('response');

    let resolveRefresh!: (tokens: typeof newMockTokens) => void;
    (authService.refreshSession as jest.Mock).mockImplementation(
      () => new Promise((res) => { resolveRefresh = res; }),
    );

    const config1 = makeConfig({ url: '/endpoint1' });
    const config2 = makeConfig({ url: '/endpoint2' });
    const err1 = make401Error(config1);
    const err2 = make401Error(config2);

    const promise1 = handler.rejected(err1);
    // promise1 is now awaiting refreshSession; start promise2 so it queues
    const promise2 = handler.rejected(err2);

    // Resolve the refresh
    resolveRefresh(newMockTokens);

    const [result1, result2] = await Promise.all([promise1, promise2]);

    // refreshSession should only be called once despite two concurrent 401s
    expect(authService.refreshSession).toHaveBeenCalledTimes(1);
    expect(result1.status).toBe(200);
    expect(result2.status).toBe(200);
  });

  it('rejects all queued requests when refresh fails', async () => {
    const refreshError = new Error('Token expired');
    let rejectRefresh!: (err: Error) => void;
    (authService.refreshSession as jest.Mock).mockImplementation(
      () => new Promise((_, rej) => { rejectRefresh = rej; }),
    );

    const handler = getInterceptorHandler('response');
    const config1 = makeConfig({ url: '/endpoint1' });
    const config2 = makeConfig({ url: '/endpoint2' });
    const err1 = make401Error(config1);
    const err2 = make401Error(config2);

    const promise1 = handler.rejected(err1);
    const promise2 = handler.rejected(err2);

    rejectRefresh(refreshError);

    await expect(promise1).rejects.toThrow('Token expired');
    await expect(promise2).rejects.toThrow('Token expired');
    expect(authService.refreshSession).toHaveBeenCalledTimes(1);
    expect(storeState.logout).toHaveBeenCalledTimes(1);
  });
});
