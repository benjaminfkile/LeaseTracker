import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

export type PasswordRule = {
  label: string;
  met: boolean;
};

export function checkPasswordRules(password: string): PasswordRule[] {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One symbol', met: /[^A-Za-z0-9]/.test(password) },
  ];
}

type Props = {
  password: string;
};

export function PasswordStrengthIndicator({
  password,
}: Props): React.ReactElement {
  const theme = useTheme();
  const rules = checkPasswordRules(password);

  return (
    <View style={styles.container} testID="password-strength-indicator">
      {rules.map(rule => (
        <View key={rule.label} style={styles.row}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor: rule.met
                  ? theme.colors.success
                  : theme.colors.border,
              },
            ]}
          />
          <Text
            style={[
              styles.label,
              {
                color: rule.met
                  ? theme.colors.success
                  : theme.colors.textSecondary,
              },
            ]}
          >
            {rule.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  dot: {
    borderRadius: 4,
    height: 8,
    marginRight: 8,
    width: 8,
  },
  label: {
    fontSize: 12,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 4,
  },
});
