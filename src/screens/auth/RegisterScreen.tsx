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
import { PasswordStrengthIndicator } from '../../components/PasswordStrengthIndicator';
import { useTheme } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';

const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

function mapRegisterError(err: unknown): string {
  const code =
    err != null && typeof err === 'object' && 'code' in err
      ? (err as { code: string }).code
      : null;
  if (code === 'UsernameExistsException') {
    return 'An account with this email already exists.';
  }
  if (code === 'InvalidPasswordException') {
    return 'Password does not meet the requirements.';
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}

export function RegisterScreen({ navigation }: Props): React.ReactElement {
  const theme = useTheme();
  const { register, isLoading } = useAuthStore(state => ({
    register: state.register,
    isLoading: state.isLoading,
  }));

  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await register(data.email, data.password, data.name);
      navigation.navigate('VerifyEmail', { email: data.email });
    } catch (err) {
      setError('root', { message: mapRegisterError(err) });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      testID="register-screen"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text
            style={[styles.title, { color: theme.colors.textPrimary }]}
            testID="register-title"
          >
            Create Account
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            Sign up to get started
          </Text>
        </View>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Name"
                placeholder="Your full name"
                autoCapitalize="words"
                autoCorrect={false}
                autoComplete="name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                errorMessage={errors.name?.message}
                testID="name-input"
              />
            )}
          />

          <View style={styles.fieldSpacing}>
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
          </View>

          <View style={styles.fieldSpacing}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Create a password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password-new"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  errorMessage={errors.password?.message}
                  testID="password-input"
                />
              )}
            />
            <PasswordStrengthIndicator password={password} />
          </View>

          <View style={styles.fieldSpacing}>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Repeat your password"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password-new"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  errorMessage={errors.confirmPassword?.message}
                  testID="confirm-password-input"
                />
              )}
            />
          </View>

          {errors.root?.message != null && (
            <View
              style={[
                styles.errorBanner,
                { backgroundColor: theme.colors.error + '1A' },
              ]}
              testID="register-error-banner"
            >
              <Text
                style={[styles.errorBannerText, { color: theme.colors.error }]}
                testID="register-error-text"
              >
                {errors.root.message}
              </Text>
            </View>
          )}

          <View style={styles.buttonSpacing} testID="create-account-button">
            <Button
              title="Create Account"
              onPress={handleSubmit(onSubmit)}
              isLoading={isLoading}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Text
            style={[styles.footerText, { color: theme.colors.textSecondary }]}
          >
            Already have an account?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            testID="sign-in-link"
          >
            <Text style={[styles.linkText, { color: theme.colors.primary }]}>
              Sign in
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
