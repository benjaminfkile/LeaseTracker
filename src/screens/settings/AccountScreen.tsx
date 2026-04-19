import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, updateMe } from '../../api/userApi';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../theme';
import type { SettingsStackNavigationProp } from '../../navigation/types';

export function AccountScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<SettingsStackNavigationProp>();
  const queryClient = useQueryClient();

  const user = useAuthStore(state => state.user);
  const forgotPassword = useAuthStore(state => state.forgotPassword);
  const logout = useAuthStore(state => state.logout);

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  const email = profile?.email ?? user?.email ?? '';

  const [displayName, setDisplayName] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: { display_name: string }) => updateMe(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me'] });
      setIsDirty(false);
      Alert.alert('Saved', 'Your display name has been updated.');
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message ?? 'Failed to update display name.');
    },
  });

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    setIsDirty(true);
  };

  const handleSave = () => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Display name cannot be empty.');
      return;
    }
    updateMutation.mutate({ display_name: trimmed });
  };

  const handleChangePassword = () => {
    if (!email) {
      Alert.alert('Error', 'Unable to determine your email address.');
      return;
    }
    Alert.alert(
      'Change Password',
      'We will send a password reset code to your email and sign you out. You can then set a new password from the login screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              await forgotPassword(email);
              Alert.alert(
                'Code Sent',
                'A reset code has been sent to your email. You will now be signed out.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      void logout();
                    },
                  },
                ],
              );
            } catch (err) {
              Alert.alert(
                'Error',
                err instanceof Error ? err.message : 'Failed to send reset code.',
              );
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      testID="account-screen"
    >
      <ScreenHeader
        title="Account"
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isLoadingProfile ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <>
              {/* ── Display Name ── */}
              <View style={styles.sectionHeader}>
                <Text
                  style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}
                  testID="account-title"
                >
                  Display Name
                </Text>
              </View>
              <View
                style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <View style={styles.cardContent}>
                  <Input
                    label="Display Name"
                    placeholder="Display name"
                    value={displayName}
                    onChangeText={handleDisplayNameChange}
                    autoCapitalize="words"
                    autoCorrect={false}
                    testID="account-display-name-input"
                  />
                  {isDirty && (
                    <View style={styles.saveButton}>
                      <Button
                        title="Save"
                        onPress={handleSave}
                        isLoading={updateMutation.isPending}
                        testID="account-save-button"
                      />
                    </View>
                  )}
                </View>
              </View>

              {/* ── Signed-in Info ── */}
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                  Email
                </Text>
              </View>
              <View
                style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                testID="account-email-row"
              >
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
                    Signed in as
                  </Text>
                  <Text
                    style={[styles.infoValue, { color: theme.colors.textPrimary }]}
                    numberOfLines={1}
                    testID="account-email"
                  >
                    {email}
                  </Text>
                </View>
              </View>

              {/* ── Change Password ── */}
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                  Security
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                onPress={handleChangePassword}
                activeOpacity={0.7}
                testID="account-change-password"
              >
                <View style={styles.rowBetween}>
                  <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>
                    Change Password
                  </Text>
                  <Text style={[styles.rowChevron, { color: theme.colors.textSecondary }]}>
                    {'>'}
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  flex: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 64,
  },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowChevron: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowLabel: {
    fontSize: 15,
  },
  saveButton: {
    marginTop: 16,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  sectionHeader: {
    marginBottom: 8,
    marginLeft: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
