import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/Button';
import { useTheme } from '../../theme';
import type { AuthStackParamList } from '../../navigation/types';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

function mapVerifyError(err: unknown): string {
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
  if (code === 'LimitExceededException') {
    return 'Too many attempts. Please try again later.';
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}

export function VerifyEmailScreen({ navigation, route }: Props): React.ReactElement {
  const { email } = route.params;
  const theme = useTheme();
  const { confirmEmail, resendCode, isLoading } = useAuthStore(state => ({
    confirmEmail: state.confirmEmail,
    resendCode: state.resendCode,
    isLoading: state.isLoading,
  }));

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>(Array(CODE_LENGTH).fill(null));
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current !== null) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  const startCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    cooldownTimerRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          if (cooldownTimerRef.current !== null) {
            clearInterval(cooldownTimerRef.current);
            cooldownTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleChangeText = useCallback(
    (text: string, index: number) => {
      const digit = text.replace(/[^0-9]/g, '').slice(-1);
      setDigits(prev => {
        const newDigits = [...prev];
        newDigits[index] = digit;
        return newDigits;
      });
      setError(null);
      if (digit && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [],
  );

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === 'Backspace' && index > 0) {
        setDigits(prev => {
          if (!prev[index]) {
            const newDigits = [...prev];
            newDigits[index - 1] = '';
            setTimeout(() => {
              inputRefs.current[index - 1]?.focus();
            }, 0);
            return newDigits;
          }
          return prev;
        });
      }
    },
    [],
  );

  const handleVerify = useCallback(async () => {
    const code = digits.join('');
    if (code.length < CODE_LENGTH) {
      setError('Please enter the complete 6-digit code.');
      return;
    }
    try {
      await confirmEmail(email, code);
      navigation.navigate('Login');
    } catch (err) {
      setError(mapVerifyError(err));
    }
  }, [digits, email, confirmEmail, navigation]);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) {
      return;
    }
    try {
      await resendCode(email);
      startCooldown();
    } catch (err) {
      setError(mapVerifyError(err));
    }
  }, [resendCooldown, email, resendCode, startCooldown]);

  const isCodeComplete = digits.every(d => d.length === 1);

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      testID="verify-email-screen"
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text
            style={[styles.title, { color: theme.colors.textPrimary }]}
            testID="verify-email-title"
          >
            Verify Email
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textSecondary }]}
          >
            {'Enter the 6-digit code sent to'}
          </Text>
          <Text
            style={[styles.emailText, { color: theme.colors.textPrimary }]}
            testID="verify-email-address"
          >
            {email}
          </Text>
        </View>

        <View style={styles.codeContainer} testID="code-input-container">
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.digitInput,
                {
                  borderColor: digit
                    ? theme.colors.primary
                    : theme.colors.border,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textPrimary,
                },
              ]}
              value={digit}
              onChangeText={text => handleChangeText(text, index)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, index)
              }
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              textAlign="center"
              testID={`digit-input-${index}`}
            />
          ))}
        </View>

        {error != null && (
          <View
            style={[
              styles.errorBanner,
              { backgroundColor: theme.colors.error + '1A' },
            ]}
            testID="verify-email-error-banner"
          >
            <Text
              style={[styles.errorBannerText, { color: theme.colors.error }]}
              testID="verify-email-error-text"
            >
              {error}
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            title="Verify"
            onPress={handleVerify}
            isLoading={isLoading}
            disabled={!isCodeComplete || isLoading}
          />
        </View>

        <View style={styles.resendContainer}>
          <Text
            style={[styles.resendText, { color: theme.colors.textSecondary }]}
          >
            {"Didn't receive a code? "}
          </Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={resendCooldown > 0}
            testID="resend-code-link"
          >
            <Text
              style={[
                styles.resendLink,
                {
                  color:
                    resendCooldown > 0
                      ? theme.colors.textSecondary
                      : theme.colors.primary,
                },
              ]}
              testID="resend-code-text"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  digitInput: {
    borderRadius: 8,
    borderWidth: 1.5,
    fontSize: 20,
    fontWeight: '600',
    height: 56,
    marginHorizontal: 4,
    width: 44,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  errorBanner: {
    borderRadius: 8,
    marginHorizontal: 24,
    marginTop: 16,
    padding: 12,
  },
  errorBannerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  flex: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  resendContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    paddingBottom: 24,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  resendText: {
    fontSize: 14,
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

