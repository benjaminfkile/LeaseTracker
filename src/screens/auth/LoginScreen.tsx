import React from 'react';
import {
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
import { useTheme } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

function mapLoginError(err: unknown): string {
  const code =
    err != null && typeof err === 'object' && 'code' in err
      ? (err as { code: string }).code
      : null;
  if (code === 'NotAuthorizedException') {
    return 'Incorrect email or password. Please try again.';
  }
  if (code === 'UserNotConfirmedException') {
    return 'Please verify your email address before signing in.';
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}

export function LoginScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const { login, isLoading } = useAuthStore(state => ({
    login: state.login,
    isLoading: state.isLoading,
  }));

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
    } catch (err) {
      setError('root', { message: mapLoginError(err) });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      testID="login-screen"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text
            style={[styles.title, { color: theme.colors.textPrimary }]}
            testID="login-title"
          >
            Welcome back
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            Sign in to your account
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
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
                errorMessage={errors.email?.message}
                testID="email-input"
              />
            )}
          />

          <View style={styles.fieldSpacing}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  errorMessage={errors.password?.message}
                  testID="password-input"
                />
              )}
            />
          </View>

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
            testID="forgot-password-link"
          >
            <Text
              style={[styles.linkText, { color: theme.colors.primary }]}
            >
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {errors.root?.message != null && (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: theme.colors.error + '1A' },
              ]}
              testID="login-error-banner"
            >
              <Text
                style={[styles.errorBannerText, { color: theme.colors.error }]}
                testID="login-error-text"
              >
                {errors.root.message}
              </Text>
            </View>
          )}

          <View style={styles.buttonSpacing} testID="sign-in-button">
            <Button
              title="Sign In"
              onPress={handleSubmit(onSubmit)}
              isLoading={isLoading}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text
            style={[styles.footerText, { color: theme.colors.textSecondary }]}
          >
            Don&apos;t have an account?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            testID="create-account-link"
          >
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>
              Create account
            </Text>
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    paddingBottom: 24,
  },
  footerText: {
    fontSize: 14,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
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
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
});
