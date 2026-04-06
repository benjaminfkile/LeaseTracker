import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '../theme';

export type OdometerInputProps = {
  value: string;
  onChange: (value: string) => void;
  errorMessage?: string;
  testID?: string;
};

export function OdometerInput({
  value,
  onChange,
  errorMessage,
  testID,
}: OdometerInputProps): React.ReactElement {
  const theme = useTheme();

  const displayValue = value.length > 0 ? parseInt(value, 10).toLocaleString() : '';

  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    onChange(cleaned);
  };

  const borderColor = errorMessage != null ? theme.colors.error : theme.colors.border;

  return (
    <View style={styles.wrapper} testID={testID ?? 'odometer-input'}>
      <View
        style={[
          styles.inputContainer,
          { borderColor, backgroundColor: theme.colors.surface },
        ]}
        testID="odometer-input-container"
      >
        <TextInput
          style={[styles.textInput, { color: theme.colors.textPrimary }]}
          value={displayValue}
          onChangeText={handleChange}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={theme.colors.textSecondary}
          accessibilityLabel="Odometer reading"
          testID="odometer-text-input"
        />
        <Text style={[styles.unit, { color: theme.colors.textSecondary }]}>mi</Text>
      </View>
      {errorMessage != null && (
        <Text
          style={[styles.errorMessage, { color: theme.colors.error }]}
          testID="odometer-input-error"
        >
          {errorMessage}
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
  inputContainer: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
  },
  unit: {
    fontSize: 20,
    fontWeight: '500',
    marginLeft: 8,
  },
  wrapper: {
    width: '100%',
  },
});
