import { create } from 'zustand';
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  forgotPassword,
  confirmForgotPassword,
  refreshSession,
  getStoredTokens,
  storeTokens,
  clearTokens,
  decodeIdToken,
  AuthTokens,
  IdTokenClaims,
} from '../auth/authService';

const TOKEN_REFRESH_THRESHOLD_SECONDS = 300; // refresh if < 5 minutes remaining

function decodeAccessTokenExp(accessToken: string): number | null {
  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // Re-add standard base64 padding stripped by base64url encoding
    const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);
    const decoded = atob(padded);
    const payload = JSON.parse(decoded) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

function isNearExpiry(accessToken: string): boolean {
  const exp = decodeAccessTokenExp(accessToken);
  if (exp === null) {
    return true;
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  return exp - nowSeconds < TOKEN_REFRESH_THRESHOLD_SECONDS;
}

export interface AuthState {
  user: IdTokenClaims | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  confirmEmail: (email: string, code: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmReset: (email: string, code: string, newPassword: string) => Promise<void>;
  refreshTokens: () => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  tokens: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const tokens = await signIn(email, password);
      await storeTokens(tokens);
      const user = decodeIdToken(tokens.idToken);
      set({ tokens, user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await signOut();
      set({ tokens: null, user: null, isAuthenticated: false, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  },

  register: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      await signUp(email, password, displayName);
      set({ isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  },

  confirmEmail: async (email, code) => {
    set({ isLoading: true, error: null });
    try {
      await confirmSignUp(email, code);
      set({ isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await forgotPassword(email);
      set({ isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  },

  confirmReset: async (email, code, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await confirmForgotPassword(email, code, newPassword);
      set({ isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  },

  refreshTokens: async () => {
    const { tokens } = get();
    if (!tokens) {
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const newTokens = await refreshSession(tokens.refreshToken);
      await storeTokens(newTokens);
      const user = decodeIdToken(newTokens.idToken);
      set({ tokens: newTokens, user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  },

  hydrateFromStorage: async () => {
    set({ isLoading: true, error: null });
    try {
      const tokens = await getStoredTokens();
      if (!tokens) {
        set({ isLoading: false });
        return;
      }

      let activeTokens = tokens;

      if (isNearExpiry(tokens.accessToken)) {
        try {
          activeTokens = await refreshSession(tokens.refreshToken);
          await storeTokens(activeTokens);
        } catch {
          await clearTokens();
          set({ isLoading: false });
          return;
        }
      }

      const user = decodeIdToken(activeTokens.idToken);
      set({ tokens: activeTokens, user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err instanceof Error ? err.message : String(err) });
    }
  },
}));
