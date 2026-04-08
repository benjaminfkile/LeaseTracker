import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { palette, useTheme } from '../theme';

export type NotificationPermissionModalProps = {
  visible: boolean;
  onAllow: () => void;
  onDeny: () => void;
};

export function NotificationPermissionModal({
  visible,
  onAllow,
  onDeny,
}: NotificationPermissionModalProps): React.ReactElement {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      testID="notification-permission-modal"
    >
      <View style={styles.backdrop} testID="notification-permission-backdrop">
        <View
          style={[styles.card, { backgroundColor: theme.colors.surface }]}
          testID="notification-permission-card"
        >
          <Text
            style={styles.icon}
            testID="notification-permission-icon"
          >
            🔔
          </Text>
          <Text
            style={[styles.title, { color: theme.colors.textPrimary }]}
            testID="notification-permission-title"
          >
            Allow Notifications
          </Text>
          <Text
            style={[styles.body, { color: theme.colors.textSecondary }]}
            testID="notification-permission-body"
          >
            Get alerts when you're approaching your mileage limit
          </Text>
          <TouchableOpacity
            style={[styles.allowButton, { backgroundColor: theme.colors.primary }]}
            onPress={onAllow}
            testID="notification-permission-allow-button"
            accessibilityRole="button"
          >
            <Text style={styles.allowButtonText} testID="notification-permission-allow-text">
              Allow Notifications
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.denyButton}
            onPress={onDeny}
            testID="notification-permission-deny-button"
            accessibilityRole="button"
          >
            <Text
              style={[styles.denyText, { color: theme.colors.textSecondary }]}
              testID="notification-permission-deny-text"
            >
              Not Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  allowButton: {
    borderRadius: 10,
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 14,
    width: '100%',
  },
  allowButtonText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    alignItems: 'center',
    borderRadius: 16,
    elevation: 4,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    width: '100%',
  },
  denyButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  denyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
});
