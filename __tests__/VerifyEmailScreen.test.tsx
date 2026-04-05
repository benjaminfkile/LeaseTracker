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

jest.useFakeTimers();

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import * as ReactNative from 'react-native';
import { useAuthStore } from '../src/stores/authStore';
import { VerifyEmailScreen } from '../src/screens/auth/VerifyEmailScreen';
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
} as unknown as NativeStackNavigationProp<AuthStackParamList, 'VerifyEmail'>;

const mockRoute = {
  key: 'VerifyEmail',
  name: 'VerifyEmail' as const,
  params: { email: 'test@example.com' },
} as RouteProp<AuthStackParamList, 'VerifyEmail'>;

const mockConfirmEmail = jest.fn();
const mockResendCode = jest.fn();

function mockAuthStore(
  overrides: {
    isLoading?: boolean;
    confirmEmail?: jest.Mock;
    resendCode?: jest.Mock;
  } = {},
) {
  const state = {
    confirmEmail: overrides.confirmEmail ?? mockConfirmEmail,
    resendCode: overrides.resendCode ?? mockResendCode,
    isLoading: overrides.isLoading ?? false,
  };
  (useAuthStore as unknown as jest.Mock).mockImplementation(
    (selector: (s: typeof state) => unknown) => selector(state),
  );
}

function renderScreen() {
  return ReactTestRenderer.create(
    <VerifyEmailScreen navigation={mockNavigation} route={mockRoute} />,
  );
}

describe('VerifyEmailScreen', () => {
  let useColorSchemeSpy: jest.SpyInstance;

  beforeEach(() => {
    useColorSchemeSpy = jest
      .spyOn(ReactNative, 'useColorScheme')
      .mockReturnValue('light');
    mockConfirmEmail.mockReset();
    mockResendCode.mockReset();
    mockNavigate.mockReset();
    mockAuthStore();
  });

  afterEach(() => {
    useColorSchemeSpy.mockRestore();
    jest.clearAllTimers();
  });

  describe('rendering', () => {
    it('renders without crashing', async () => {
      await ReactTestRenderer.act(() => {
        renderScreen();
      });
    });

    it('has verify-email-screen testID', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const screen = renderer!.root.findByProps({
        testID: 'verify-email-screen',
      });
      expect(screen).toBeDefined();
    });

    it('renders the Verify Email title', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const title = renderer!.root.findByProps({ testID: 'verify-email-title' });
      expect(title.props.children).toBe('Verify Email');
    });

    it('renders the email address from route params', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const emailText = renderer!.root.findByProps({
        testID: 'verify-email-address',
      });
      expect(emailText.props.children).toBe('test@example.com');
    });

    it('renders 6 digit input boxes', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      expect(inputs.length).toBe(6);
    });

    it('each digit input has the correct testID', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      for (let i = 0; i < 6; i++) {
        const input = renderer!.root.findByProps({ testID: `digit-input-${i}` });
        expect(input).toBeDefined();
      }
    });

    it('each digit input has number-pad keyboard type', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      inputs.forEach(input => {
        expect(input.props.keyboardType).toBe('number-pad');
      });
    });

    it('each digit input has maxLength of 1', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      inputs.forEach(input => {
        expect(input.props.maxLength).toBe(1);
      });
    });

    it('renders the Verify button', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const verifyButton = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      expect(verifyButton).toBeDefined();
    });

    it('renders the resend code link', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const resendLink = renderer!.root.findByProps({
        testID: 'resend-code-link',
      });
      expect(resendLink).toBeDefined();
    });

    it('resend code link shows "Resend code" initially', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const resendText = renderer!.root.findByProps({
        testID: 'resend-code-text',
      });
      expect(resendText.props.children).toBe('Resend code');
    });

    it('does not render error banner initially', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      expect(() =>
        renderer!.root.findByProps({ testID: 'verify-email-error-banner' }),
      ).toThrow();
    });

    it('renders without crashing in dark mode', async () => {
      useColorSchemeSpy.mockReturnValue('dark');
      await ReactTestRenderer.act(() => {
        renderScreen();
      });
    });
  });

  describe('loading state', () => {
    it('shows loading indicator on Verify button when isLoading is true', async () => {
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

  describe('digit input interactions', () => {
    it('updates digit value when text is entered', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('1');
      });
      expect(inputs[0].props.value).toBe('1');
    });

    it('strips non-numeric characters from digit input', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('a');
      });
      expect(inputs[0].props.value).toBe('');
    });

    it('clears error message when a digit is entered', async () => {
      mockConfirmEmail.mockRejectedValue(
        Object.assign(new Error('Invalid code'), { code: 'CodeMismatchException' }),
      );
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      // Fill all 6 digits to enable the button
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('1');
        inputs[1].props.onChangeText('2');
        inputs[2].props.onChangeText('3');
        inputs[3].props.onChangeText('4');
        inputs[4].props.onChangeText('5');
        inputs[5].props.onChangeText('6');
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const verifyButton = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        verifyButton!.props.onPress();
      });

      // Error should be shown
      expect(() =>
        renderer!.root.findByProps({ testID: 'verify-email-error-banner' }),
      ).not.toThrow();

      // Typing a new digit should clear the error
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('9');
      });

      expect(() =>
        renderer!.root.findByProps({ testID: 'verify-email-error-banner' }),
      ).toThrow();
    });
  });

  describe('form validation', () => {
    it('does not call confirmEmail when code is incomplete', async () => {
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      // Only fill 3 of 6 digits
      const inputs = renderer!.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        inputs[0].props.onChangeText('1');
        inputs[1].props.onChangeText('2');
        inputs[2].props.onChangeText('3');
      });

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const verifyButton = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      // Button is disabled when code is incomplete
      expect(verifyButton!.props.disabled).toBe(true);
    });
  });

  describe('form submission', () => {
    async function fillAllDigits(
      renderer: ReactTestRenderer.ReactTestRenderer,
      code = '123456',
    ) {
      const inputs = renderer.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        for (let i = 0; i < 6; i++) {
          inputs[i].props.onChangeText(code[i]);
        }
      });
    }

    it('calls confirmEmail with email and code on valid submit', async () => {
      mockConfirmEmail.mockResolvedValue(undefined);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      await fillAllDigits(renderer!);

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const verifyButton = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        verifyButton!.props.onPress();
      });

      expect(mockConfirmEmail).toHaveBeenCalledWith('test@example.com', '123456');
    });

    it('navigates to Login on successful verification', async () => {
      mockConfirmEmail.mockResolvedValue(undefined);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });

      await fillAllDigits(renderer!);

      const touchables = renderer!.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const verifyButton = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        verifyButton!.props.onPress();
      });

      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('error handling', () => {
    async function submitWithError(
      renderer: ReactTestRenderer.ReactTestRenderer,
    ) {
      const inputs = renderer.root.findAllByType(ReactNative.TextInput);
      await ReactTestRenderer.act(() => {
        for (let i = 0; i < 6; i++) {
          inputs[i].props.onChangeText(String(i + 1));
        }
      });
      const touchables = renderer.root.findAllByType(
        ReactNative.TouchableOpacity,
      );
      const verifyButton = touchables.find(
        t => t.props.accessibilityRole === 'button',
      );
      await ReactTestRenderer.act(async () => {
        verifyButton!.props.onPress();
      });
    }

    it('shows CodeMismatchException error message', async () => {
      mockConfirmEmail.mockRejectedValue(
        Object.assign(new Error('Invalid code.'), {
          code: 'CodeMismatchException',
        }),
      );
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await submitWithError(renderer!);
      const errorText = renderer!.root.findByProps({
        testID: 'verify-email-error-text',
      });
      expect(errorText.props.children).toBe(
        'Invalid verification code. Please try again.',
      );
    });

    it('shows ExpiredCodeException error message', async () => {
      mockConfirmEmail.mockRejectedValue(
        Object.assign(new Error('Code expired.'), {
          code: 'ExpiredCodeException',
        }),
      );
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await submitWithError(renderer!);
      const errorText = renderer!.root.findByProps({
        testID: 'verify-email-error-text',
      });
      expect(errorText.props.children).toBe(
        'Verification code has expired. Please request a new one.',
      );
    });

    it('shows LimitExceededException error message', async () => {
      mockConfirmEmail.mockRejectedValue(
        Object.assign(new Error('Limit exceeded.'), {
          code: 'LimitExceededException',
        }),
      );
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await submitWithError(renderer!);
      const errorText = renderer!.root.findByProps({
        testID: 'verify-email-error-text',
      });
      expect(errorText.props.children).toBe(
        'Too many attempts. Please try again later.',
      );
    });

    it('shows generic error message for unknown errors', async () => {
      mockConfirmEmail.mockRejectedValue(new Error('Network error'));
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await submitWithError(renderer!);
      const errorText = renderer!.root.findByProps({
        testID: 'verify-email-error-text',
      });
      expect(errorText.props.children).toBe('Network error');
    });

    it('shows fallback generic message for non-Error rejections', async () => {
      mockConfirmEmail.mockRejectedValue('unknown');
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await submitWithError(renderer!);
      const errorText = renderer!.root.findByProps({
        testID: 'verify-email-error-text',
      });
      expect(errorText.props.children).toBe(
        'Something went wrong. Please try again.',
      );
    });

    it('shows error banner when verification fails', async () => {
      mockConfirmEmail.mockRejectedValue(
        Object.assign(new Error('Invalid code.'), {
          code: 'CodeMismatchException',
        }),
      );
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      await submitWithError(renderer!);
      const banner = renderer!.root.findByProps({
        testID: 'verify-email-error-banner',
      });
      expect(banner).toBeDefined();
    });
  });

  describe('resend code', () => {
    it('calls resendCode with the email when resend link is pressed', async () => {
      mockResendCode.mockResolvedValue(undefined);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const resendLink = renderer!.root.findByProps({
        testID: 'resend-code-link',
      });
      await ReactTestRenderer.act(async () => {
        resendLink.props.onPress();
      });
      expect(mockResendCode).toHaveBeenCalledWith('test@example.com');
    });

    it('disables resend link after sending and shows countdown', async () => {
      mockResendCode.mockResolvedValue(undefined);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const resendLink = renderer!.root.findByProps({
        testID: 'resend-code-link',
      });
      await ReactTestRenderer.act(async () => {
        resendLink.props.onPress();
      });
      expect(resendLink.props.disabled).toBe(true);
      const resendText = renderer!.root.findByProps({
        testID: 'resend-code-text',
      });
      expect(resendText.props.children).toBe('Resend in 60s');
    });

    it('re-enables resend link after 60 seconds', async () => {
      mockResendCode.mockResolvedValue(undefined);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const resendLink = renderer!.root.findByProps({
        testID: 'resend-code-link',
      });
      await ReactTestRenderer.act(async () => {
        resendLink.props.onPress();
      });
      await ReactTestRenderer.act(() => {
        jest.advanceTimersByTime(60000);
      });
      expect(resendLink.props.disabled).toBe(false);
      const resendText = renderer!.root.findByProps({
        testID: 'resend-code-text',
      });
      expect(resendText.props.children).toBe('Resend code');
    });

    it('shows countdown decreasing over time', async () => {
      mockResendCode.mockResolvedValue(undefined);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const resendLink = renderer!.root.findByProps({
        testID: 'resend-code-link',
      });
      await ReactTestRenderer.act(async () => {
        resendLink.props.onPress();
      });
      await ReactTestRenderer.act(() => {
        jest.advanceTimersByTime(5000);
      });
      const resendText = renderer!.root.findByProps({
        testID: 'resend-code-text',
      });
      expect(resendText.props.children).toBe('Resend in 55s');
    });

    it('does not call resendCode again when cooldown is active', async () => {
      mockResendCode.mockResolvedValue(undefined);
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const resendLink = renderer!.root.findByProps({
        testID: 'resend-code-link',
      });
      await ReactTestRenderer.act(async () => {
        resendLink.props.onPress();
      });
      mockResendCode.mockClear();
      await ReactTestRenderer.act(async () => {
        resendLink.props.onPress();
      });
      expect(mockResendCode).not.toHaveBeenCalled();
    });

    it('shows error banner when resend fails', async () => {
      mockResendCode.mockRejectedValue(
        Object.assign(new Error('Limit exceeded.'), {
          code: 'LimitExceededException',
        }),
      );
      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(() => {
        renderer = renderScreen();
      });
      const resendLink = renderer!.root.findByProps({
        testID: 'resend-code-link',
      });
      await ReactTestRenderer.act(async () => {
        resendLink.props.onPress();
      });
      const errorText = renderer!.root.findByProps({
        testID: 'verify-email-error-text',
      });
      expect(errorText.props.children).toBe(
        'Too many attempts. Please try again later.',
      );
    });
  });
});

