import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { PasswordStrengthIndicator } from '../../components/PasswordStrengthIndicator';
import { useTheme } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetSchema = z
  .object({
    code: z.string().min(1, 'Verification code is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type EmailFormData = z.infer<typeof emailSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

function mapForgotPasswordError(err: unknown): string {
  const code =
    err != null && typeof err === 'object' && 'code' in err
      ? (err as { code: string }).code
      : null;
  if (code === 'UserNotFoundException') {
    return 'No account found with this email address.';
  }
  if (code === 'LimitExceededException') {
    return 'Too many attempts. Please try again later.';
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}

function mapResetError(err: unknown): string {
  const code =
    err != null && typeof err === 'object' && 'code' in err
      ? (err as { code: string }).code
      : null;
  if (code === 'CodeMismatchException') {
    return 'Invalid verification code. Please try again.';
  }
  if (code === 'ExpiredCodeException') {
    return 'Verification code has expired. Please request a new one.';
  }
  if (code === 'InvalidPasswordException') {
    return 'Password does not meet the requirements.';
  }
  if (code === 'LimitExceededException') {
    return 'Too many attempts. Please try again later.';
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}

export function ForgotPasswordScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [emailForReset, setEmailForReset] = useState('');

  const forgotPassword = useAuthStore(state => state.forgotPassword);
  const confirmReset = useAuthStore(state => state.confirmReset);
  const isLoading = useAuthStore(state => state.isLoading);

  const {
    control: emailControl,
    handleSubmit: handleEmailSubmit,
    setError: setEmailError,
    formState: { errors: emailErrors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const {
    control: resetControl,
    handleSubmit: handleResetSubmit,
    watch,
    setError: setResetError,
    formState: { errors: resetErrors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: '', newPassword: '', confirmPassword: '' },
  });

  const newPassword = watch('newPassword');

  const onEmailSubmit = async (data: EmailFormData) => {
    try {
      await forgotPassword(data.email);
      setEmailForReset(data.email);
      setStep('reset');
    } catch (err) {
      setEmailError('root', { message: mapForgotPasswordError(err) });
    }
  };

  const onResetSubmit = async (data: ResetFormData) => {
    try {
      await confirmReset(emailForReset, data.code, data.newPassword);
      Alert.alert(
        'Password Reset',
        'Your password has been reset successfully. Please sign in with your new password.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }],
      );
    } catch (err) {
      setResetError('root', { message: mapResetError(err) });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      testID="forgot-password-screen"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text
            style={[styles.title, { color: theme.colors.textPrimary }]}
            testID="forgot-password-title"
          >
            {step === 'email' ? 'Forgot Password' : 'Reset Password'}
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
            testID="forgot-password-subtitle"
          >
            {step === 'email'
              ? 'Enter your email to receive a reset code'
              : `Enter the code sent to ${emailForReset}`}
          </Text>
        </View>

        {step === 'email' ? (
          <View key="step-email" style={styles.form} testID="step-email">
            <Controller
              control={emailControl}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  errorMessage={emailErrors.email?.message}
                  testID="email-input"
                />
              )}
            />

            {emailErrors.root?.message != null && (
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: theme.colors.error + '1A' },
                ]}
                testID="email-error-banner"
              >
                <Text
                  style={[
                    styles.errorBannerText,
                    { color: theme.colors.error },
                  ]}
                  testID="email-error-text"
                >
                  {emailErrors.root.message}
                </Text>
              </View>
            )}

            <View style={styles.buttonSpacing} testID="send-code-button">
              <Button
                title="Send Reset Code"
                onPress={handleEmailSubmit(onEmailSubmit)}
                isLoading={isLoading}
              />
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                testID="back-to-login-link"
              >
                <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                  Back to Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View key="step-reset" style={styles.form} testID="step-reset">
            <Controller
              control={resetControl}
              name="code"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Verification Code"
                  placeholder="Enter the 6-digit code"
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  errorMessage={resetErrors.code?.message}
                  testID="code-input"
                />
              )}
            />

            <View style={styles.fieldSpacing}>
              <Controller
                control={resetControl}
                name="newPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="New Password"
                    placeholder="Create a new password"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password-new"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    errorMessage={resetErrors.newPassword?.message}
                    testID="new-password-input"
                  />
                )}
              />
              <PasswordStrengthIndicator password={newPassword} />
            </View>

            <View style={styles.fieldSpacing}>
              <Controller
                control={resetControl}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Confirm Password"
                    placeholder="Repeat your new password"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password-new"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    errorMessage={resetErrors.confirmPassword?.message}
                    testID="confirm-password-input"
                  />
                )}
              />
            </View>

            {resetErrors.root?.message != null && (
              <View
                style={[
                  styles.errorBanner,
                  { backgroundColor: theme.colors.error + '1A' },
                ]}
                testID="reset-error-banner"
              >
                <Text
                  style={[
                    styles.errorBannerText,
                    { color: theme.colors.error },
                  ]}
                  testID="reset-error-text"
                >
                  {resetErrors.root.message}
                </Text>
              </View>
            )}

            <View style={styles.buttonSpacing} testID="reset-password-button">
              <Button
                title="Reset Password"
                onPress={handleResetSubmit(onResetSubmit)}
                isLoading={isLoading}
              />
            </View>

            <View style={styles.footer}>
              <TouchableOpacity
                onPress={() => setStep('email')}
                testID="back-to-email-link"
              >
                <Text style={[styles.linkText, { color: theme.colors.primary }]}>
                  Change email address
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  buttonSpacing: {
    marginTop: 24,
  },
  errorBanner: {
    borderRadius: 8,
    marginTop: 16,
    padding: 12,
  },
  errorBannerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  fieldSpacing: {
    marginTop: 16,
  },
  flex: {
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  form: {
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
});
