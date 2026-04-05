// Mocks must be declared before imports so they are in place when modules load.
jest.mock('react-native-config', () => ({
  COGNITO_USER_POOL_ID: 'us-east-1_TestPool',
  COGNITO_CLIENT_ID: 'TestClientId',
  AWS_REGION: 'us-east-1',
}));

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
import { useAuthStore } from '../src/stores/authStore';
import { LoginScreen } from '../src/screens/auth/LoginScreen';
import type { AuthStackParamList } from '../src/navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
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
} as unknown as NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const mockRoute = {
  key: 'Login',
  name: 'Login' as const,
  params: undefined,
} as RouteProp<AuthStackParamList, 'Login'>;

const mockLogin = jest.fn();

function mockAuthStore(overrides: { isLoading?: boolean; login?: jest.Mock } = {}) {
  const state = {
    login: overrides.login ?? mockLogin,
    isLoading: overrides.isLoading ?? false,
  };
  (useAuthStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: typeof state) => unknown) => selector(state),
  );
}

function renderScreen() {
  return ReactTestRenderer.create(
    <LoginScreen navigation={mockNavigation} route={mockRoute} />,
  );
}

describe('LoginScreen', () => {
  let useColorSchemeSpy: jest.SpyInstance;

  beforeEach(() => {
    useColorSchemeSpy = jest
      .spyOn(ReactNative, 'useColorScheme')
      .mockReturnValue('light');
    mockLogin.mockReset();
    mockNavigate.mockReset();
    mockAuthStore();
  });

  afterEach(() => {
    useColorSchemeSpy.mockRestore();
  });

  describe('rendering', () => {
    it('renders without crashing', async () => {
      await ReactTestRenderer.act(() => {
        renderScreen();
      });
    });

    it('renders the welcome title', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const title = renderer!.root.findByProps({ testID: 'login-title' });
      expect(title.props.children).toBe('Welcome back');
    });

    it('renders two text inputs (email and password)', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      expect(inputs.length).toBe(2);
    });

    it('renders the email input with correct props', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      const emailInput = inputs[0];
      expect(emailInput.props.placeholder).toBe('you@example.com');
      expect(emailInput.props.keyboardType).toBe('email-address');
      expect(emailInput.props.autoCapitalize).toBe('none');
    });

    it('renders the password input with secureTextEntry', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      const passwordInput = inputs[1];
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('renders the Sign In button', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const signInButton = renderer!.root.findByProps({
        testID: 'sign-in-button',
      });
      expect(signInButton).toBeDefined();
    });

    it('renders the Forgot Password? link', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const link = renderer!.root.findByProps({ testID: 'forgot-password-link' });
      expect(link).toBeDefined();
    });

    it('renders the Create account link', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const link = renderer!.root.findByProps({
        testID: 'create-account-link',
      });
      expect(link).toBeDefined();
    });

    it('does not render error banner initially', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      expect(() =>
        renderer!.root.findByProps({ testID: 'login-error-banner' }),
      ).toThrow();
    });
  });

  describe('loading state', () => {
    it('shows loading indicator on Sign In button when isLoading is true', async () => {
      mockAuthStore({ isLoading: true });
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const indicator = renderer!.root.findByType(ReactNative.ActivityIndicator);
      expect(indicator).toBeDefined();
    });

    it('does not show loading indicator when isLoading is false', async () => {
      mockAuthStore({ isLoading: false });
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      expect(() =>
        renderer!.root.findByType(ReactNative.ActivityIndicator),
      ).toThrow();
    });
  });

  describe('navigation', () => {
    it('navigates to ForgotPassword when Forgot Password? is pressed', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const link = renderer!.root.findByProps({ testID: 'forgot-password-link' });
      await ReactTestRenderer.act(() => {
        link.props.onPress();
      });
      expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
    });

    it('navigates to Register when Create account is pressed', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const link = renderer!.root.findByProps({ testID: 'create-account-link' });
      await ReactTestRenderer.act(() => {
        link.props.onPress();
      });
      expect(mockNavigate).toHaveBeenCalledWith('Register');
    });
  });

  describe('form validation', () => {
    it('shows email validation error when submitting with invalid email', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('not-an-email');
        inputs[1].props.onChangeText('somepassword');
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const signInTouchable = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        signInTouchable!.props.onPress();
      });

      const errorNodes = renderer!.root.findAllByProps({
        testID: 'input-error-message',
      });
      expect(errorNodes.length).toBeGreaterThan(0);
    });

    it('shows password required error when submitting with empty password', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('test@example.com');
        inputs[1].props.onChangeText('');
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const signInTouchable = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        signInTouchable!.props.onPress();
      });

      const errorNodes = renderer!.root.findAllByProps({
        testID: 'input-error-message',
      });
      expect(errorNodes.length).toBeGreaterThan(0);
    });

    it('does not call login when form is invalid', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const signInTouchable = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        signInTouchable!.props.onPress();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe('form submission', () => {
    it('calls login with email and password on valid submit', async () => {
      mockLogin.mockResolvedValue(undefined);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('user@example.com');
        inputs[1].props.onChangeText('password123');
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const signInTouchable = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        signInTouchable!.props.onPress();
      });

      expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'password123');
    });
  });

  describe('error handling', () => {
    it('shows wrong credentials message on NotAuthorizedException', async () => {
      const error = Object.assign(new Error('Incorrect username or password.'), {
        code: 'NotAuthorizedException',
      });
      mockLogin.mockRejectedValue(error);

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('user@example.com');
        inputs[1].props.onChangeText('wrongpassword');
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const signInTouchable = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        signInTouchable!.props.onPress();
      });

      const errorText = renderer!.root.findByProps({ testID: 'login-error-text' });
      expect(errorText.props.children).toBe(
        'Incorrect email or password. Please try again.',
      );
    });

    it('shows unconfirmed account message on UserNotConfirmedException', async () => {
      const error = Object.assign(new Error('User is not confirmed.'), {
        code: 'UserNotConfirmedException',
      });
      mockLogin.mockRejectedValue(error);

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('user@example.com');
        inputs[1].props.onChangeText('password123');
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const signInTouchable = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        signInTouchable!.props.onPress();
      });

      const errorText = renderer!.root.findByProps({ testID: 'login-error-text' });
      expect(errorText.props.children).toBe(
        'Please verify your email address before signing in.',
      );
    });

    it('shows generic error message for unknown errors', async () => {
      const error = new Error('Network error');
      mockLogin.mockRejectedValue(error);

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('user@example.com');
        inputs[1].props.onChangeText('password123');
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const signInTouchable = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        signInTouchable!.props.onPress();
      });

      const errorText = renderer!.root.findByProps({ testID: 'login-error-text' });
      expect(errorText.props.children).toBe('Network error');
    });

    it('shows fallback generic message for non-Error rejections', async () => {
      mockLogin.mockRejectedValue('unknown');

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('user@example.com');
        inputs[1].props.onChangeText('password123');
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const signInTouchable = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        signInTouchable!.props.onPress();
      });

      const errorText = renderer!.root.findByProps({ testID: 'login-error-text' });
      expect(errorText.props.children).toBe(
        'Something went wrong. Please try again.',
      );
    });

    it('shows error banner when there is a root error', async () => {
      const error = Object.assign(new Error('Incorrect username or password.'), {
        code: 'NotAuthorizedException',
      });
      mockLogin.mockRejectedValue(error);

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('user@example.com');
        inputs[1].props.onChangeText('wrongpassword');
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const signInTouchable = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        signInTouchable!.props.onPress();
      });

      const banner = renderer!.root.findByProps({ testID: 'login-error-banner' });
      expect(banner).toBeDefined();
    });
  });

  describe('dark mode', () => {
    it('renders without crashing in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      await ReactTestRenderer.act(() => {
        renderScreen();
      });
    });
  });
});
