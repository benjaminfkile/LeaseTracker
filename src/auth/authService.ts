import {
  AuthenticationDetails,
  CognitoRefreshToken,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  CognitoUserSession,
} from 'amazon-cognito-identity-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cognitoConfig } from './cognitoConfig';

const TOKENS_STORAGE_KEY = '@auth_tokens';

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

export interface IdTokenClaims {
  sub: string;
  email: string;
  name?: string;
  [key: string]: unknown;
}

if (!cognitoConfig.UserPoolId || !cognitoConfig.ClientId) {
  throw new Error(
    'Cognito UserPoolId and ClientId must be set in environment config',
  );
}

const userPool = new CognitoUserPool({
  UserPoolId: cognitoConfig.UserPoolId,
  ClientId: cognitoConfig.ClientId,
});

function getCognitoUser(email: string): CognitoUser {
  return new CognitoUser({ Username: email, Pool: userPool });
}

function tokensFromSession(session: CognitoUserSession): AuthTokens {
  return {
    accessToken: session.getAccessToken().getJwtToken(),
    idToken: session.getIdToken().getJwtToken(),
    refreshToken: session.getRefreshToken().getToken(),
  };
}

export function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<CognitoUser> {
  return new Promise((resolve, reject) => {
    const attributes = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      new CognitoUserAttribute({ Name: 'name', Value: displayName }),
    ];
    userPool.signUp(email, password, attributes, [], (err, result) => {
      if (err || !result) {
        reject(err ?? new Error('Sign up failed'));
        return;
      }
      resolve(result.user);
    });
  });
}

export function confirmSignUp(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = getCognitoUser(email);
    user.confirmRegistration(code, true, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

export function signIn(email: string, password: string): Promise<AuthTokens> {
  return new Promise((resolve, reject) => {
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });
    const user = getCognitoUser(email);
    user.authenticateUser(authDetails, {
      onSuccess(session) {
        resolve(tokensFromSession(session));
      },
      onFailure(err) {
        reject(err);
      },
    });
  });
}

export async function signOut(): Promise<void> {
  const user = userPool.getCurrentUser();
  if (user) {
    user.signOut();
  }
  await clearTokens();
}

export function forgotPassword(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = getCognitoUser(email);
    user.forgotPassword({
      onSuccess() {
        resolve();
      },
      onFailure(err) {
        reject(err);
      },
    });
  });
}

export function confirmForgotPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = getCognitoUser(email);
    user.confirmPassword(code, newPassword, {
      onSuccess() {
        resolve();
      },
      onFailure(err) {
        reject(err);
      },
    });
  });
}

export function refreshSession(refreshToken: string): Promise<AuthTokens> {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    if (!user) {
      reject(new Error('No current user'));
      return;
    }
    const token = new CognitoRefreshToken({ RefreshToken: refreshToken });
    user.refreshSession(token, (err, session) => {
      if (err || !session) {
        reject(err ?? new Error('Session refresh failed'));
        return;
      }
      resolve(tokensFromSession(session));
    });
  });
}

export function resendConfirmationCode(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = getCognitoUser(email);
    user.resendConfirmationCode((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

export async function getStoredTokens(): Promise<AuthTokens | null> {
  const raw = await AsyncStorage.getItem(TOKENS_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as AuthTokens;
}

export async function storeTokens(tokens: AuthTokens): Promise<void> {
  await AsyncStorage.setItem(TOKENS_STORAGE_KEY, JSON.stringify(tokens));
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.removeItem(TOKENS_STORAGE_KEY);
}

export function decodeIdToken(idToken: string): IdTokenClaims {
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format');
  }
  const base64Url = parts[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '=='.slice(0, (4 - (base64.length % 4)) % 4);
  const decoded = atob(padded);
  return JSON.parse(decoded) as IdTokenClaims;
}
