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
import { ForgotPasswordScreen } from '../src/screens/auth/ForgotPasswordScreen';
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
} as unknown as NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const mockRoute = {
  key: 'ForgotPassword',
  name: 'ForgotPassword' as const,
  params: undefined,
} as RouteProp<AuthStackParamList, 'ForgotPassword'>;

const mockForgotPassword = jest.fn();
const mockConfirmReset = jest.fn();

function mockAuthStore(
  overrides: {
    isLoading?: boolean;
    forgotPassword?: jest.Mock;
    confirmReset?: jest.Mock;
  } = {},
) {
  const state = {
    forgotPassword: overrides.forgotPassword ?? mockForgotPassword,
    confirmReset: overrides.confirmReset ?? mockConfirmReset,
    isLoading: overrides.isLoading ?? false,
  };
  (useAuthStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: typeof state) => unknown) => selector(state),
  );
}

function renderScreen() {
  return ReactTestRenderer.create(
    <ForgotPasswordScreen navigation={mockNavigation} route={mockRoute} />,
  );
}

/** Helper: advance from Step 1 to Step 2 by submitting a valid email. */
async function advanceToResetStep(
  renderer: ReactTestRenderer.ReactTestRenderer,
) {
  const inputs = renderer.root.findAllByType(ReactNative.TextInput);
  await ReactTestRenderer.act(() => {
    inputs[0].props.onChangeText('user@example.com');
  });
  const touchables = renderer.root.findAllByType(ReactNative.TouchableOpacity);
  const sendCodeBtn = touchables.find(
    t => t.props.accessibilityRole === 'button',
  );
  await ReactTestRenderer.act(async () => {
    await sendCodeBtn!.props.onPress();
  });
  // Flush pending effects so Step 2 Controllers finish registering with the form.
  await ReactTestRenderer.act(async () => {});
}

describe('ForgotPasswordScreen', () => {
  let useColorSchemeSpy: jest.SpyInstance;
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    useColorSchemeSpy = jest
      .spyOn(ReactNative, 'useColorScheme')
      .mockReturnValue('light');
    alertSpy = jest.spyOn(ReactNative.Alert, 'alert').mockImplementation(() => {});
    mockForgotPassword.mockReset();
    mockConfirmReset.mockReset();
    mockNavigate.mockReset();
    mockAuthStore();
  });

  afterEach(() => {
    useColorSchemeSpy.mockRestore();
    alertSpy.mockRestore();
  });

  describe('rendering — Step 1 (email)', () => {
    it('renders without crashing', async () => {
      await ReactTestRenderer.act(() => {
        renderScreen();
      });
    });

    it('has forgot-password-screen testID', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const screen = renderer!.root.findByProps({
        testID: 'forgot-password-screen',
      });
      expect(screen).toBeDefined();
    });

    it('renders "Forgot Password" title on Step 1', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const title = renderer!.root.findByProps({
        testID: 'forgot-password-title',
      });
      expect(title.props.children).toBe('Forgot Password');
    });

    it('renders one email input on Step 1', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      expect(inputs.length).toBe(1);
      expect(inputs[0].props.keyboardType).toBe('email-address');
    });

    it('renders the Send Reset Code button', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const btn = renderer!.root.findByProps({ testID: 'send-code-button' });
      expect(btn).toBeDefined();
    });

    it('renders the Back to Sign In link', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const link = renderer!.root.findByProps({
        testID: 'back-to-login-link',
      });
      expect(link).toBeDefined();
    });

    it('does not render email error banner initially', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      expect(() =>
        renderer!.root.findByProps({ testID: 'email-error-banner' }),
      ).toThrow();
    });

    it('renders without crashing in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      await ReactTestRenderer.act(() => {
        renderScreen();
      });
    });
  });

  describe('navigation — Step 1', () => {
    it('navigates to Login when Back to Sign In is pressed', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const link = renderer!.root.findByProps({
        testID: 'back-to-login-link',
      });
      await ReactTestRenderer.act(() => {
        link.props.onPress();
      });
      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('form validation — Step 1', () => {
    it('shows email validation error when submitting empty email', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const sendCodeBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        sendCodeBtn!.props.onPress();
      });
      const errorNodes = renderer!.root.findAllByProps({
        testID: 'input-error-message',
      });
      expect(errorNodes.length).toBeGreaterThan(0);
    });

    it('shows email validation error when email is invalid', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('not-an-email');
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const sendCodeBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        sendCodeBtn!.props.onPress();
      });
      const errorNodes = renderer!.root.findAllByProps({
        testID: 'input-error-message',
      });
      expect(errorNodes.length).toBeGreaterThan(0);
    });

    it('does not call forgotPassword when form is invalid', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const sendCodeBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        sendCodeBtn!.props.onPress();
      });
      expect(mockForgotPassword).not.toHaveBeenCalled();
    });
  });

  describe('form submission — Step 1', () => {
    it('calls forgotPassword with email on valid submit', async () => {
      mockForgotPassword.mockResolvedValue(undefined);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('user@example.com');
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const sendCodeBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        sendCodeBtn!.props.onPress();
      });
      expect(mockForgotPassword).toHaveBeenCalledWith('user@example.com');
    });

    it('advances to Step 2 after successful forgotPassword call', async () => {
      mockForgotPassword.mockResolvedValue(undefined);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      const title = renderer!.root.findByProps({
        testID: 'forgot-password-title',
      });
      expect(title.props.children).toBe('Reset Password');
    });
  });

  describe('error handling — Step 1', () => {
    it('shows no-account message on UserNotFoundException', async () => {
      const error = Object.assign(new Error('User not found.'), {
        code: 'UserNotFoundException',
      });
      mockForgotPassword.mockRejectedValue(error);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('unknown@example.com');
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const sendCodeBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        sendCodeBtn!.props.onPress();
      });
      const errorText = renderer!.root.findByProps({
        testID: 'email-error-text',
      });
      expect(errorText.props.children).toBe(
        'No account found with this email address.',
      );
    });

    it('shows rate-limit message on LimitExceededException', async () => {
      const error = Object.assign(new Error('Limit exceeded.'), {
        code: 'LimitExceededException',
      });
      mockForgotPassword.mockRejectedValue(error);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('user@example.com');
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const sendCodeBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        sendCodeBtn!.props.onPress();
      });
      const errorText = renderer!.root.findByProps({
        testID: 'email-error-text',
      });
      expect(errorText.props.children).toBe(
        'Too many attempts. Please try again later.',
      );
    });

    it('shows generic message for unknown Step 1 errors', async () => {
      const error = new Error('Network error');
      mockForgotPassword.mockRejectedValue(error);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('user@example.com');
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const sendCodeBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        sendCodeBtn!.props.onPress();
      });
      const errorText = renderer!.root.findByProps({
        testID: 'email-error-text',
      });
      expect(errorText.props.children).toBe('Network error');
    });

    it('shows fallback generic message for non-Error Step 1 rejections', async () => {
      mockForgotPassword.mockRejectedValue('unknown');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('user@example.com');
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const sendCodeBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        sendCodeBtn!.props.onPress();
      });
      const errorText = renderer!.root.findByProps({
        testID: 'email-error-text',
      });
      expect(errorText.props.children).toBe(
        'Something went wrong. Please try again.',
      );
    });

    it('shows error banner when there is a Step 1 root error', async () => {
      const error = Object.assign(new Error('User not found.'), {
        code: 'UserNotFoundException',
      });
      mockForgotPassword.mockRejectedValue(error);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('user@example.com');
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const sendCodeBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        sendCodeBtn!.props.onPress();
      });
      const banner = renderer!.root.findByProps({
        testID: 'email-error-banner',
      });
      expect(banner).toBeDefined();
    });
  });

  describe('loading state', () => {
    it('shows loading indicator on Send Reset Code button when isLoading is true', async () => {
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

  describe('rendering — Step 2 (reset)', () => {
    beforeEach(() => {
      mockForgotPassword.mockResolvedValue(undefined);
    });

    it('renders "Reset Password" title on Step 2', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      const title = renderer!.root.findByProps({
        testID: 'forgot-password-title',
      });
      expect(title.props.children).toBe('Reset Password');
    });

    it('renders step-reset container on Step 2', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      const stepReset = renderer!.root.findByProps({ testID: 'step-reset' });
      expect(stepReset).toBeDefined();
    });

    it('renders three inputs on Step 2 (code, newPassword, confirmPassword)', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      expect(inputs.length).toBe(3);
    });

    it('renders the Reset Password button', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      const btn = renderer!.root.findByProps({
        testID: 'reset-password-button',
      });
      expect(btn).toBeDefined();
    });

    it('renders the Change email address link', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      const link = renderer!.root.findByProps({
        testID: 'back-to-email-link',
      });
      expect(link).toBeDefined();
    });

    it('does not render reset error banner initially on Step 2', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      expect(() =>
        renderer!.root.findByProps({ testID: 'reset-error-banner' }),
      ).toThrow();
    });

    it('returns to Step 1 when Change email address is pressed', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      const link = renderer!.root.findByProps({
        testID: 'back-to-email-link',
      });
      await ReactTestRenderer.act(() => {
        link.props.onPress();
      });
      const title = renderer!.root.findByProps({
        testID: 'forgot-password-title',
      });
      expect(title.props.children).toBe('Forgot Password');
    });
  });

  describe('form validation — Step 2', () => {
    beforeEach(() => {
      mockForgotPassword.mockResolvedValue(undefined);
    });

    it('shows code required error when submitting empty code', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const resetBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        await resetBtn!.props.onPress();
      });
      const errorNodes = renderer!.root.findAllByProps({
        testID: 'input-error-message',
      });
      expect(errorNodes.length).toBeGreaterThan(0);
    });

    it('shows password too short error when new password is less than 8 chars', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('123456');
        inputs[1].props.onChangeText('short');
        inputs[2].props.onChangeText('short');
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const resetBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        await resetBtn!.props.onPress();
      });
      const errorNodes = renderer!.root.findAllByProps({
        testID: 'input-error-message',
      });
      expect(errorNodes.length).toBeGreaterThan(0);
    });

    it('shows passwords do not match error when confirmPassword differs', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('123456');
        inputs[1].props.onChangeText('Password1!');
        inputs[2].props.onChangeText('DifferentPass1!');
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const resetBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        await resetBtn!.props.onPress();
      });
      const errorNodes = renderer!.root.findAllByProps({
        testID: 'input-error-message',
      });
      expect(errorNodes.length).toBeGreaterThan(0);
    });

    it('does not call confirmReset when form is invalid', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const resetBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        await resetBtn!.props.onPress();
      });
      expect(mockConfirmReset).not.toHaveBeenCalled();
    });
  });

  describe('form submission — Step 2', () => {
    beforeEach(() => {
      mockForgotPassword.mockResolvedValue(undefined);
    });

    it('calls confirmReset with email, code, and new password on valid submit', async () => {
      mockConfirmReset.mockResolvedValue(undefined);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('123456');
        inputs[1].props.onChangeText('NewPassword1!');
        inputs[2].props.onChangeText('NewPassword1!');
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const resetBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        await resetBtn!.props.onPress();
      });
      expect(mockConfirmReset).toHaveBeenCalledWith(
        'user@example.com',
        '123456',
        'NewPassword1!',
      );
    });

    it('shows success Alert after successful password reset', async () => {
      mockConfirmReset.mockResolvedValue(undefined);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('123456');
        inputs[1].props.onChangeText('NewPassword1!');
        inputs[2].props.onChangeText('NewPassword1!');
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const resetBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        await resetBtn!.props.onPress();
      });
      expect(alertSpy).toHaveBeenCalledWith(
        'Password Reset',
        expect.stringContaining('password has been reset'),
        expect.any(Array),
      );
    });

    it('navigates to Login when OK is pressed on success Alert', async () => {
      mockConfirmReset.mockResolvedValue(undefined);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('123456');
        inputs[1].props.onChangeText('NewPassword1!');
        inputs[2].props.onChangeText('NewPassword1!');
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const resetBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        await resetBtn!.props.onPress();
      });
      // Simulate pressing OK on the Alert
      const alertCall = alertSpy.mock.calls[0];
      const buttons = alertCall[2] as Array<{ text: string; onPress: () => void }>;
      const okButton = buttons.find(b => b.text === 'OK');
      await ReactTestRenderer.act(() => {
        okButton!.onPress();
      });
      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('error handling — Step 2', () => {
    beforeEach(() => {
      mockForgotPassword.mockResolvedValue(undefined);
    });

    it('shows invalid code message on CodeMismatchException', async () => {
      const error = Object.assign(new Error('Invalid code.'), {
        code: 'CodeMismatchException',
      });
      mockConfirmReset.mockRejectedValue(error);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('000000');
        inputs[1].props.onChangeText('NewPassword1!');
        inputs[2].props.onChangeText('NewPassword1!');
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const resetBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        await resetBtn!.props.onPress();
      });
      const errorText = renderer!.root.findByProps({
        testID: 'reset-error-text',
      });
      expect(errorText.props.children).toBe(
        'Invalid verification code. Please try again.',
      );
    });

    it('shows expired code message on ExpiredCodeException', async () => {
      const error = Object.assign(new Error('Expired code.'), {
        code: 'ExpiredCodeException',
      });
      mockConfirmReset.mockRejectedValue(error);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('123456');
        inputs[1].props.onChangeText('NewPassword1!');
        inputs[2].props.onChangeText('NewPassword1!');
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const resetBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        await resetBtn!.props.onPress();
      });
      const errorText = renderer!.root.findByProps({
        testID: 'reset-error-text',
      });
      expect(errorText.props.children).toBe(
        'Verification code has expired. Please request a new one.',
      );
    });

    it('shows invalid password message on InvalidPasswordException', async () => {
      const error = Object.assign(new Error('Invalid password.'), {
        code: 'InvalidPasswordException',
      });
      mockConfirmReset.mockRejectedValue(error);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('123456');
        inputs[1].props.onChangeText('NewPassword1!');
        inputs[2].props.onChangeText('NewPassword1!');
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const resetBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        await resetBtn!.props.onPress();
      });
      const errorText = renderer!.root.findByProps({
        testID: 'reset-error-text',
      });
      expect(errorText.props.children).toBe(
        'Password does not meet the requirements.',
      );
    });

    it('shows rate-limit message on LimitExceededException in Step 2', async () => {
      const error = Object.assign(new Error('Limit exceeded.'), {
        code: 'LimitExceededException',
      });
      mockConfirmReset.mockRejectedValue(error);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('123456');
        inputs[1].props.onChangeText('NewPassword1!');
        inputs[2].props.onChangeText('NewPassword1!');
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const resetBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        await resetBtn!.props.onPress();
      });
      const errorText = renderer!.root.findByProps({
        testID: 'reset-error-text',
      });
      expect(errorText.props.children).toBe(
        'Too many attempts. Please try again later.',
      );
    });

    it('shows generic message for unknown Step 2 errors', async () => {
      const error = new Error('Network error');
      mockConfirmReset.mockRejectedValue(error);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('123456');
        inputs[1].props.onChangeText('NewPassword1!');
        inputs[2].props.onChangeText('NewPassword1!');
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const resetBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        await resetBtn!.props.onPress();
      });
      const errorText = renderer!.root.findByProps({
        testID: 'reset-error-text',
      });
      expect(errorText.props.children).toBe('Network error');
    });

    it('shows fallback generic message for non-Error Step 2 rejections', async () => {
      mockConfirmReset.mockRejectedValue('unknown');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('123456');
        inputs[1].props.onChangeText('NewPassword1!');
        inputs[2].props.onChangeText('NewPassword1!');
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const resetBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        await resetBtn!.props.onPress();
      });
      const errorText = renderer!.root.findByProps({
        testID: 'reset-error-text',
      });
      expect(errorText.props.children).toBe(
        'Something went wrong. Please try again.',
      );
    });

    it('shows reset error banner when there is a Step 2 root error', async () => {
      const error = Object.assign(new Error('Invalid code.'), {
        code: 'CodeMismatchException',
      });
      mockConfirmReset.mockRejectedValue(error);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await advanceToResetStep(renderer!);
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('000000');
        inputs[1].props.onChangeText('NewPassword1!');
        inputs[2].props.onChangeText('NewPassword1!');
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const resetBtn = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        await resetBtn!.props.onPress();
      });
      const banner = renderer!.root.findByProps({
        testID: 'reset-error-banner',
      });
      expect(banner).toBeDefined();
    });
  });
});
