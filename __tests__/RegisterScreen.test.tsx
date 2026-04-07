// Mocks must be declared before imports so they are in place when modules load.
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
import { useAuthStore } from '../src/stores/authStore';
import { RegisterScreen } from '../src/screens/auth/RegisterScreen';
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
} as unknown as NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const mockRoute = {
  key: 'Register',
  name: 'Register' as const,
  params: undefined,
} as RouteProp<AuthStackParamList, 'Register'>;

const mockRegister = jest.fn();

function mockAuthStore(
  overrides: { isLoading?: boolean; register?: jest.Mock } = {},
) {
  const state = {
    register: overrides.register ?? mockRegister,
    isLoading: overrides.isLoading ?? false,
  };
  (useAuthStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: typeof state) => unknown) => selector(state),
  );
}

function renderScreen() {
  return ReactTestRenderer.create(
    <RegisterScreen navigation={mockNavigation} route={mockRoute} />,
  );
}

describe('RegisterScreen', () => {
  let useColorSchemeSpy: jest.SpyInstance;

  beforeEach(() => {
    useColorSchemeSpy = jest
      .spyOn(ReactNative, 'useColorScheme')
      .mockReturnValue('light');
    mockRegister.mockReset();
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

    it('has register-screen testID', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const screen = renderer!.root.findByProps({ testID: 'register-screen' });
      expect(screen).toBeDefined();
    });

    it('renders the Create Account title', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const title = renderer!.root.findByProps({ testID: 'register-title' });
      expect(title.props.children).toBe('Create Account');
    });

    it('renders four text inputs (name, email, password, confirm password)', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      expect(inputs.length).toBe(4);
    });

    it('renders the name input with correct props', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const nameInput = renderer!.root.findByProps({ testID: 'name-input' });
      expect(nameInput).toBeDefined();
    });

    it('renders the email input with correct props', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      const emailInput = inputs[1];
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
      const passwordInput = inputs[2];
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });

    it('renders the confirm password input with secureTextEntry', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      const confirmInput = inputs[3];
      expect(confirmInput.props.secureTextEntry).toBe(true);
    });

    it('renders the Create Account button', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const button = renderer!.root.findByProps({
        testID: 'create-account-button',
      });
      expect(button).toBeDefined();
    });

    it('renders the Sign in link', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const link = renderer!.root.findByProps({ testID: 'sign-in-link' });
      expect(link).toBeDefined();
    });

    it('renders the password strength indicator', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const indicator = renderer!.root.findByProps({
        testID: 'password-strength-indicator',
      });
      expect(indicator).toBeDefined();
    });

    it('does not render error banner initially', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      expect(() =>
        renderer!.root.findByProps({ testID: 'register-error-banner' }),
      ).toThrow();
    });
  });

  describe('loading state', () => {
    it('shows loading indicator on Create Account button when isLoading is true', async () => {
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
    it('navigates to Login when Sign in is pressed', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const link = renderer!.root.findByProps({ testID: 'sign-in-link' });
      await ReactTestRenderer.act(() => {
        link.props.onPress();
      });
      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });

    it('navigates to VerifyEmail with email on successful registration', async () => {
      mockRegister.mockResolvedValue(undefined);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('John Doe');
        inputs[1].props.onChangeText('john@example.com');
        inputs[2].props.onChangeText('Password1!');
        inputs[3].props.onChangeText('Password1!');
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const submitTouchable = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        submitTouchable!.props.onPress();
      });

      expect(mockNavigate).toHaveBeenCalledWith('VerifyEmail', {
        email: 'john@example.com',
      });
    });
  });

  describe('form validation', () => {
    it('shows name required error when submitting with empty name', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('');
        inputs[1].props.onChangeText('john@example.com');
        inputs[2].props.onChangeText('Password1!');
        inputs[3].props.onChangeText('Password1!');
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const submitTouchable = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        submitTouchable!.props.onPress();
      });

      const errorNodes = renderer!.root.findAllByProps({
        testID: 'input-error-message',
      });
      expect(errorNodes.length).toBeGreaterThan(0);
    });

    it('shows email validation error when submitting with invalid email', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('John Doe');
        inputs[1].props.onChangeText('not-an-email');
        inputs[2].props.onChangeText('Password1!');
        inputs[3].props.onChangeText('Password1!');
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const submitTouchable = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        submitTouchable!.props.onPress();
      });

      const errorNodes = renderer!.root.findAllByProps({
        testID: 'input-error-message',
      });
      expect(errorNodes.length).toBeGreaterThan(0);
    });

    it('shows password too short error when password has fewer than 8 characters', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('John Doe');
        inputs[1].props.onChangeText('john@example.com');
        inputs[2].props.onChangeText('Abc1!');
        inputs[3].props.onChangeText('Abc1!');
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const submitTouchable = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        submitTouchable!.props.onPress();
      });

      const errorNodes = renderer!.root.findAllByProps({
        testID: 'input-error-message',
      });
      expect(errorNodes.length).toBeGreaterThan(0);
    });

    it('shows confirm password mismatch error when passwords do not match', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('John Doe');
        inputs[1].props.onChangeText('john@example.com');
        inputs[2].props.onChangeText('Password1!');
        inputs[3].props.onChangeText('DifferentPass1!');
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const submitTouchable = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        submitTouchable!.props.onPress();
      });

      const errorNodes = renderer!.root.findAllByProps({
        testID: 'input-error-message',
      });
      expect(errorNodes.length).toBeGreaterThan(0);
    });

    it('does not call register when form is invalid', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const submitTouchable = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        submitTouchable!.props.onPress();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  describe('form submission', () => {
    it('calls register with email, password, and name on valid submit', async () => {
      mockRegister.mockResolvedValue(undefined);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('John Doe');
        inputs[1].props.onChangeText('john@example.com');
        inputs[2].props.onChangeText('Password1!');
        inputs[3].props.onChangeText('Password1!');
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const submitTouchable = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        submitTouchable!.props.onPress();
      });

      expect(mockRegister).toHaveBeenCalledWith(
        'john@example.com',
        'Password1!',
        'John Doe',
      );
    });
  });

  describe('error handling', () => {
    it('shows existing account message on UsernameExistsException', async () => {
      const error = Object.assign(new Error('User already exists.'), {
        code: 'UsernameExistsException',
      });
      mockRegister.mockRejectedValue(error);

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('John Doe');
        inputs[1].props.onChangeText('john@example.com');
        inputs[2].props.onChangeText('Password1!');
        inputs[3].props.onChangeText('Password1!');
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const submitTouchable = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        submitTouchable!.props.onPress();
      });

      const errorText = renderer!.root.findByProps({
        testID: 'register-error-text',
      });
      expect(errorText.props.children).toBe(
        'An account with this email already exists.',
      );
    });

    it('shows invalid password message on InvalidPasswordException', async () => {
      const error = Object.assign(new Error('Password does not conform.'), {
        code: 'InvalidPasswordException',
      });
      mockRegister.mockRejectedValue(error);

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('John Doe');
        inputs[1].props.onChangeText('john@example.com');
        inputs[2].props.onChangeText('Password1!');
        inputs[3].props.onChangeText('Password1!');
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const submitTouchable = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        submitTouchable!.props.onPress();
      });

      const errorText = renderer!.root.findByProps({
        testID: 'register-error-text',
      });
      expect(errorText.props.children).toBe(
        'Password does not meet the requirements.',
      );
    });

    it('shows generic error message for unknown errors', async () => {
      const error = new Error('Network error');
      mockRegister.mockRejectedValue(error);

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('John Doe');
        inputs[1].props.onChangeText('john@example.com');
        inputs[2].props.onChangeText('Password1!');
        inputs[3].props.onChangeText('Password1!');
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const submitTouchable = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        submitTouchable!.props.onPress();
      });

      const errorText = renderer!.root.findByProps({
        testID: 'register-error-text',
      });
      expect(errorText.props.children).toBe('Network error');
    });

    it('shows fallback generic message for non-Error rejections', async () => {
      mockRegister.mockRejectedValue('unknown');

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('John Doe');
        inputs[1].props.onChangeText('john@example.com');
        inputs[2].props.onChangeText('Password1!');
        inputs[3].props.onChangeText('Password1!');
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const submitTouchable = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        submitTouchable!.props.onPress();
      });

      const errorText = renderer!.root.findByProps({
        testID: 'register-error-text',
      });
      expect(errorText.props.children).toBe(
        'Something went wrong. Please try again.',
      );
    });

    it('shows error banner when there is a root error', async () => {
      const error = Object.assign(new Error('User already exists.'), {
        code: 'UsernameExistsException',
      });
      mockRegister.mockRejectedValue(error);

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('John Doe');
        inputs[1].props.onChangeText('john@example.com');
        inputs[2].props.onChangeText('Password1!');
        inputs[3].props.onChangeText('Password1!');
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const submitTouchable = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        submitTouchable!.props.onPress();
      });

      const banner = renderer!.root.findByProps({
        testID: 'register-error-banner',
      });
      expect(banner).toBeDefined();
    });
  });

  describe('password strength indicator', () => {
    it('updates strength indicator as password is typed', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[2].props.onChangeText('Password1!');
      });

      const indicator = renderer!.root.findByProps({
        testID: 'password-strength-indicator',
      });
      expect(indicator).toBeDefined();
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
