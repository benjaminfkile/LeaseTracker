import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';

export type LoadingOverlayProps = {
  visible: boolean;
};

export function LoadingOverlay({ visible }: LoadingOverlayProps): React.ReactElement {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      testID="loading-overlay-modal"
    >
      <View style={styles.backdrop} testID="loading-overlay-backdrop">
        <View
          style={[styles.spinnerContainer, { backgroundColor: theme.colors.surface }]}
          testID="loading-overlay-spinner-container"
        >
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
            testID="loading-overlay-indicator"
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
  },
  spinnerContainer: {
    borderRadius: 12,
    elevation: 4,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
