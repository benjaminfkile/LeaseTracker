import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { useTheme } from '../theme';

export type InputProps = TextInputProps & {
  label?: string;
  errorMessage?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

export function Input({
  label,
  errorMessage,
  helperText,
  leftIcon,
  rightIcon,
  onFocus,
  onBlur,
  style,
  ...textInputProps
}: InputProps): React.ReactElement {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const hasError = Boolean(errorMessage);

  const borderColor = hasError
    ? theme.colors.error
    : isFocused
      ? theme.colors.primary
      : theme.colors.border;

  return (
    <View style={styles.wrapper}>
      {label != null && (
        <Text
          style={[styles.label, { color: theme.colors.textPrimary }]}
          testID="input-label"
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor,
            backgroundColor: theme.colors.surface,
          },
        ]}
        testID="input-container"
      >
        {leftIcon != null && (
          <View style={styles.leftIconWrapper} testID="input-left-icon">
            {leftIcon}
          </View>
        )}

        <TextInput
          style={[
            styles.textInput,
            { color: theme.colors.textPrimary },
            style,
          ]}
          placeholderTextColor={theme.colors.textSecondary}
          onFocus={e => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={e => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...textInputProps}
        />

        {rightIcon != null && (
          <View style={styles.rightIconWrapper} testID="input-right-icon">
            {rightIcon}
          </View>
        )}
      </View>

      {hasError && (
        <Text
          style={[styles.errorMessage, { color: theme.colors.error }]}
          testID="input-error-message"
        >
          {errorMessage}
        </Text>
      )}

      {!hasError && helperText != null && (
        <Text
          style={[styles.helperText, { color: theme.colors.textSecondary }]}
          testID="input-helper-text"
        >
          {helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  errorMessage: {
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  leftIconWrapper: {
    marginRight: 8,
  },
  rightIconWrapper: {
    marginLeft: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  wrapper: {
    width: '100%',
  },
});
