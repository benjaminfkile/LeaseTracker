import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAccount } from '../../api/userApi';
import { getMe } from '../../api/userApi';
import { Button } from '../../components/Button';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useSubscription } from '../../hooks/useSubscription';
import { useAuthStore } from '../../stores/authStore';
import { useAppearanceStore } from '../../stores/appearanceStore';
import type { AppearanceMode } from '../../stores/appearanceStore';
import { useLeasesStore } from '../../stores/leasesStore';
import { useTheme, palette } from '../../theme';
import type { SettingsStackNavigationProp } from '../../navigation/types';
import { useQuery } from '@tanstack/react-query';

const APP_VERSION = require('../../../package.json').version;

const APP_STORE_URL = 'https://apps.apple.com/app/leasetracker/id0000000000';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.benkile.leasetracker';
const HELP_URL = 'https://leasetracker.app/help';
const PRIVACY_URL = 'https://leasetracker.app/privacy';
const TERMS_URL = 'https://leasetracker.app/terms';

const APPEARANCE_OPTIONS: { label: string; value: AppearanceMode }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' },
];

export function SettingsScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<SettingsStackNavigationProp>();
  const queryClient = useQueryClient();

  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);

  const appearanceMode = useAppearanceStore(state => state.mode);
  const setAppearanceMode = useAppearanceStore(state => state.setMode);

  const leases = useLeasesStore(state => state.leases);
  const activeLeaseId = useLeasesStore(state => state.activeLeaseId);
  const setActiveLeaseId = useLeasesStore(state => state.setActiveLeaseId);

  const { isPremium } = useSubscription();

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  const [isSigningOut, setIsSigningOut] = useState(false);

  const deleteAccountMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      await logout();
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message ?? 'Failed to delete account.');
    },
  });

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : user?.name ?? '';
  const email = profile?.email ?? user?.email ?? '';
  const initial = displayName.charAt(0).toUpperCase() || email.charAt(0).toUpperCase() || '?';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setIsSigningOut(true);
          try {
            await logout();
          } finally {
            setIsSigningOut(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAccountMutation.mutate();
          },
        },
      ],
    );
  };

  const handleRateApp = () => {
    const url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    void Linking.openURL(url);
  };

  const handleShareApp = () => {
    const url = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    void Share.share({
      message: `Check out LeaseTracker - the best way to manage your car lease! ${url}`,
    });
  };

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      testID="settings-screen"
    >
      <ScreenHeader title="Settings" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="settings-scroll"
      >
        {/* ── Account ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Account
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          onPress={() => navigation.navigate('Account')}
          activeOpacity={0.7}
          testID="settings-account"
        >
          <View style={styles.accountRow}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.accountInfo}>
              <Text
                style={[styles.accountName, { color: theme.colors.textPrimary }]}
                numberOfLines={1}
              >
                {displayName || 'User'}
              </Text>
              <Text
                style={[styles.accountEmail, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {email}
              </Text>
            </View>
            <Text style={[styles.rowChevron, { color: theme.colors.textSecondary }]}>{'>'}</Text>
          </View>
        </TouchableOpacity>

        {/* ── Subscription ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Subscription
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          onPress={() => navigation.navigate('Subscription')}
          activeOpacity={0.7}
          testID="settings-subscription"
        >
          <View style={styles.rowBetween}>
            <View style={styles.rowCenter}>
              <View
                style={[
                  styles.tierBadge,
                  { backgroundColor: isPremium ? theme.colors.primary : theme.colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.tierBadgeText,
                    { color: isPremium ? palette.white : theme.colors.textSecondary },
                  ]}
                >
                  {isPremium ? 'Premium' : 'Free'}
                </Text>
              </View>
            </View>
            <Text style={[styles.rowChevron, { color: theme.colors.textSecondary }]}>{'>'}</Text>
          </View>
        </TouchableOpacity>

        {/* ── Notifications ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Notifications
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          onPress={() => navigation.navigate('AlertSettings')}
          activeOpacity={0.7}
          testID="settings-notifications"
        >
          <View style={styles.rowBetween}>
            <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>
              Alert Settings
            </Text>
            <Text style={[styles.rowChevron, { color: theme.colors.textSecondary }]}>{'>'}</Text>
          </View>
        </TouchableOpacity>

        {/* ── Appearance ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            Appearance
          </Text>
        </View>
        <View
          style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          testID="settings-appearance"
        >
          <View style={[styles.segmentedControl, { backgroundColor: theme.colors.background }]}>
            {APPEARANCE_OPTIONS.map(option => {
              const isSelected = appearanceMode === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.segmentOption,
                    isSelected && { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={() => {
                    void setAppearanceMode(option.value);
                  }}
                  activeOpacity={0.7}
                  testID={`settings-appearance-${option.value}`}
                >
                  <Text
                    style={[
                      styles.segmentLabel,
                      {
                        color: isSelected ? palette.white : theme.colors.textPrimary,
                        fontWeight: isSelected ? '600' : '400',
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Default Lease ── */}
        {leases.length > 1 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                Default Lease
              </Text>
            </View>
            <View
              style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              testID="settings-default-lease"
            >
              {leases.map(lease => {
                const label = `${lease.vehicleYear} ${lease.vehicleMake} ${lease.vehicleModel}`;
                const isSelected = activeLeaseId === lease.id;
                return (
                  <TouchableOpacity
                    key={lease.id}
                    style={[
                      styles.leaseOption,
                      isSelected && { backgroundColor: theme.colors.background },
                      { borderColor: theme.colors.border },
                    ]}
                    onPress={() => setActiveLeaseId(lease.id)}
                    activeOpacity={0.7}
                    testID={`settings-lease-${lease.id}`}
                  >
                    <View
                      style={[
                        styles.radioOuter,
                        { borderColor: isSelected ? theme.colors.primary : theme.colors.border },
                      ]}
                    >
                      {isSelected && (
                        <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.leaseLabel,
                        { color: theme.colors.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ── App ── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            App
          </Text>
        </View>
        <View
          style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          testID="settings-app"
        >
          <TouchableOpacity
            style={[styles.appRow, { borderBottomColor: theme.colors.border }]}
            onPress={handleRateApp}
            activeOpacity={0.7}
            testID="settings-rate-app"
          >
            <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>
              Rate the App
            </Text>
            <Text style={[styles.rowChevron, { color: theme.colors.textSecondary }]}>{'>'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.appRow, { borderBottomColor: theme.colors.border }]}
            onPress={handleShareApp}
            activeOpacity={0.7}
            testID="settings-share-app"
          >
            <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>
              Share the App
            </Text>
            <Text style={[styles.rowChevron, { color: theme.colors.textSecondary }]}>{'>'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.appRow, { borderBottomColor: theme.colors.border }]}
            onPress={() => {
              void Linking.openURL(HELP_URL);
            }}
            activeOpacity={0.7}
            testID="settings-help"
          >
            <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>
              Help & FAQ
            </Text>
            <Text style={[styles.rowChevron, { color: theme.colors.textSecondary }]}>{'>'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.appRow, { borderBottomColor: theme.colors.border }]}
            onPress={() => {
              void Linking.openURL(PRIVACY_URL);
            }}
            activeOpacity={0.7}
            testID="settings-privacy"
          >
            <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>
              Privacy Policy
            </Text>
            <Text style={[styles.rowChevron, { color: theme.colors.textSecondary }]}>{'>'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.appRow, { borderBottomColor: theme.colors.border }]}
            onPress={() => {
              void Linking.openURL(TERMS_URL);
            }}
            activeOpacity={0.7}
            testID="settings-terms"
          >
            <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>
              Terms of Service
            </Text>
            <Text style={[styles.rowChevron, { color: theme.colors.textSecondary }]}>{'>'}</Text>
          </TouchableOpacity>

          <View style={styles.appRowLast}>
            <Text style={[styles.rowLabel, { color: theme.colors.textPrimary }]}>
              App Version
            </Text>
            <Text style={[styles.rowSubtitle, { color: theme.colors.textSecondary }]}>
              {APP_VERSION}
            </Text>
          </View>
        </View>

        {/* ── Sign Out ── */}
        <View style={styles.buttonSection}>
          <Button
            title="Sign Out"
            variant="destructive"
            onPress={handleSignOut}
            isLoading={isSigningOut}
            testID="settings-sign-out"
          />
        </View>

        {/* ── Delete Account ── */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
          disabled={deleteAccountMutation.isPending}
          activeOpacity={0.7}
          testID="settings-delete-account"
        >
          <Text style={[styles.deleteButtonText, { color: theme.colors.error }]}>
            {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  accountEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  accountInfo: {
    flex: 1,
    marginLeft: 12,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
  },
  accountRow: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: 16,
  },
  appRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  appRowLast: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarText: {
    color: palette.white,
    fontSize: 18,
    fontWeight: '700',
  },
  buttonSection: {
    marginHorizontal: 16,
    marginTop: 24,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  deleteButton: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 16,
    paddingVertical: 12,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  flex: {
    flex: 1,
  },
  leaseLabel: {
    flex: 1,
    fontSize: 15,
    marginLeft: 10,
  },
  leaseOption: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  radioInner: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  radioOuter: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowCenter: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  rowChevron: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowLabel: {
    fontSize: 15,
  },
  rowSubtitle: {
    fontSize: 14,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  sectionHeader: {
    marginLeft: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  segmentLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  segmentOption: {
    borderRadius: 8,
    flex: 1,
    paddingVertical: 8,
  },
  segmentedControl: {
    borderRadius: 10,
    flexDirection: 'row',
    margin: 12,
    padding: 2,
  },
  tierBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
