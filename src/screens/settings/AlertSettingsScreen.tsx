import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { getAlertConfig, updateAlertConfig } from '../../api/alertsApi';
import { Button } from '../../components/Button';
import { ErrorMessage } from '../../components/ErrorMessage';
import { LeaseSelectorPills } from '../../components/LeaseSelectorPills';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useLeasesStore } from '../../stores/leasesStore';
import { useTheme } from '../../theme';
import type { AlertConfig, UpdateAlertConfigInput } from '../../types/api';
import type { SettingsStackNavigationProp } from '../../navigation/types';

// ---------- Constants ----------

const DEFAULT_APPROACHING_PERCENT = 80;
const DEFAULT_LEASE_END_DAYS = 30;
const DEFAULT_BUYBACK_THRESHOLD = 50;
const PERCENT_STEP = 5;
const DAYS_STEP = 1;
const DOLLARS_STEP = 10;
const PERCENT_MIN = 1;
const PERCENT_MAX = 100;
const DAYS_MIN = 1;
const DAYS_MAX = 365;
const DOLLARS_MIN = 10;
const DOLLARS_MAX = 500;

// ---------- Helpers ----------

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function configToFormState(config: AlertConfig): FormState {
  return {
    approachingLimitEnabled: config.approachingLimitEnabled,
    approachingLimitPercent: config.approachingLimitPercent,
    overPaceEnabled: config.overPaceEnabled,
    leaseEndEnabled: config.leaseEndEnabled,
    leaseEndDays: config.leaseEndDays,
    savedTripEnabled: config.savedTripEnabled,
    mileageBuybackEnabled: config.mileageBuybackEnabled,
    mileageBuybackThresholdDollars: config.mileageBuybackThresholdDollars,
  };
}

function defaultFormState(): FormState {
  return {
    approachingLimitEnabled: false,
    approachingLimitPercent: DEFAULT_APPROACHING_PERCENT,
    overPaceEnabled: false,
    leaseEndEnabled: false,
    leaseEndDays: DEFAULT_LEASE_END_DAYS,
    savedTripEnabled: false,
    mileageBuybackEnabled: false,
    mileageBuybackThresholdDollars: DEFAULT_BUYBACK_THRESHOLD,
  };
}

// ---------- Types ----------

type FormState = {
  approachingLimitEnabled: boolean;
  approachingLimitPercent: number;
  overPaceEnabled: boolean;
  leaseEndEnabled: boolean;
  leaseEndDays: number;
  savedTripEnabled: boolean;
  mileageBuybackEnabled: boolean;
  mileageBuybackThresholdDollars: number;
};

// ---------- Stepper ----------

type StepperProps = {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  minReached: boolean;
  maxReached: boolean;
  prefix?: string;
  suffix: string;
  testID?: string;
};

function Stepper({
  value,
  onDecrement,
  onIncrement,
  minReached,
  maxReached,
  prefix,
  suffix,
  testID,
}: StepperProps): React.ReactElement {
  const theme = useTheme();

  return (
    <View style={stepperStyles.row} testID={testID}>
      <TouchableOpacity
        onPress={onDecrement}
        disabled={minReached}
        accessibilityRole="button"
        accessibilityLabel="Decrease"
        testID={testID != null ? `${testID}-decrement` : undefined}
        style={[
          stepperStyles.button,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: minReached ? 0.4 : 1,
          },
        ]}
      >
        <Text style={[stepperStyles.buttonText, { color: theme.colors.textPrimary }]}>{'−'}</Text>
      </TouchableOpacity>

      <Text
        style={[stepperStyles.value, { color: theme.colors.textPrimary }]}
        testID={testID != null ? `${testID}-value` : undefined}
      >
        {`${prefix ?? ''}${value}${suffix}`}
      </Text>

      <TouchableOpacity
        onPress={onIncrement}
        disabled={maxReached}
        accessibilityRole="button"
        accessibilityLabel="Increase"
        testID={testID != null ? `${testID}-increment` : undefined}
        style={[
          stepperStyles.button,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: maxReached ? 0.4 : 1,
          },
        ]}
      >
        <Text style={[stepperStyles.buttonText, { color: theme.colors.textPrimary }]}>{'+'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 22,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 56,
    textAlign: 'center',
  },
});

// ---------- ToggleRow ----------

type ToggleRowProps = {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  testID?: string;
};

function ToggleRow({
  label,
  value,
  onValueChange,
  testID,
}: ToggleRowProps): React.ReactElement {
  const theme = useTheme();

  return (
    <View style={toggleRowStyles.row} testID={testID != null ? `${testID}-row` : undefined}>
      <Text style={[toggleRowStyles.label, { color: theme.colors.textPrimary }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        testID={testID}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor={Platform.OS === 'android' ? theme.colors.surface : undefined}
      />
    </View>
  );
}

const toggleRowStyles = StyleSheet.create({
  label: {
    flex: 1,
    fontSize: 16,
    marginRight: 12,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

// ---------- Screen ----------

async function sendTestNotification(): Promise<void> {
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });
  await notifee.displayNotification({
    title: 'LeaseTracker Test',
    body: 'This is a test notification from LeaseTracker.',
    android: { channelId },
  });
}

export function AlertSettingsScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<SettingsStackNavigationProp>();
  const queryClient = useQueryClient();

  const leases = useLeasesStore(state => state.leases);
  const activeLeaseId = useLeasesStore(state => state.activeLeaseId);

  const defaultLeaseId = activeLeaseId ?? leases[0]?.id ?? '';
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>(defaultLeaseId);
  const [form, setForm] = useState<FormState>(defaultFormState());
  const [isSendingTest, setIsSendingTest] = useState(false);

  const {
    data: alertConfig,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['alert-config', selectedLeaseId],
    queryFn: () => getAlertConfig(selectedLeaseId),
    enabled: selectedLeaseId !== '',
  });

  useEffect(() => {
    if (alertConfig != null) {
      setForm(configToFormState(alertConfig));
    } else {
      setForm(defaultFormState());
    }
  }, [alertConfig]);

  const { mutate: saveConfig, isPending: isSaving } = useMutation({
    mutationFn: (data: UpdateAlertConfigInput) => updateAlertConfig(selectedLeaseId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alert-config', selectedLeaseId] });
      Alert.alert('Saved', 'Alert settings have been saved.');
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message ?? 'Failed to save alert settings.');
    },
  });

  const handleSave = () => {
    saveConfig({
      approachingLimitEnabled: form.approachingLimitEnabled,
      approachingLimitPercent: form.approachingLimitPercent,
      overPaceEnabled: form.overPaceEnabled,
      leaseEndEnabled: form.leaseEndEnabled,
      leaseEndDays: form.leaseEndDays,
      savedTripEnabled: form.savedTripEnabled,
      mileageBuybackEnabled: form.mileageBuybackEnabled,
      mileageBuybackThresholdDollars: form.mileageBuybackThresholdDollars,
    });
  };

  const handleTestNotification = () => {
    setIsSendingTest(true);
    sendTestNotification()
      .catch((err: Error) => {
        Alert.alert('Error', err.message ?? 'Failed to send test notification.');
      })
      .finally(() => {
        setIsSendingTest(false);
      });
  };

  const noLeases = leases.length === 0;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="alert-settings-screen"
    >
      <ScreenHeader
        title="Alert Settings"
        onBackPress={() => navigation.goBack()}
      />

      {noLeases ? (
        <SafeAreaView edges={['bottom']} style={styles.flex}>
          <View style={styles.center}>
            <Text
              style={[styles.emptyText, { color: theme.colors.textSecondary }]}
              testID="alert-settings-no-leases"
            >
              {'Add a lease to configure alert settings.'}
            </Text>
          </View>
        </SafeAreaView>
      ) : (
        <SafeAreaView edges={['bottom']} style={styles.flex}>
          {leases.length > 1 && (
            <LeaseSelectorPills
              leases={leases}
              selectedId={selectedLeaseId}
              onSelect={id => {
                setSelectedLeaseId(id);
              }}
            />
          )}

          {isLoading ? (
            <View style={styles.center} testID="alert-settings-loading">
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : error != null ? (
            <ErrorMessage
              message="Failed to load alert settings"
              onRetry={() => {
                void queryClient.invalidateQueries({
                  queryKey: ['alert-config', selectedLeaseId],
                });
              }}
            />
          ) : (
            <>
              <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                testID="alert-settings-scroll"
              >
                <Text
                  style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}
                  testID="alert-settings-title"
                >
                  {'ALERT TYPES'}
                </Text>

                {/* Approaching mileage limit */}
                <View
                  style={[
                    styles.card,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ]}
                  testID="approaching-limit-card"
                >
                  <ToggleRow
                    label="Approaching mileage limit"
                    value={form.approachingLimitEnabled}
                    onValueChange={v =>
                      setForm(prev => ({ ...prev, approachingLimitEnabled: v }))
                    }
                    testID="approaching-limit-toggle"
                  />
                  {form.approachingLimitEnabled && (
                    <View testID="approaching-limit-stepper-container">
                      <Text
                        style={[styles.stepperLabel, { color: theme.colors.textSecondary }]}
                      >
                        {"Notify when I've used this % of my mileage allowance:"}
                      </Text>
                      <Stepper
                        value={form.approachingLimitPercent}
                        onDecrement={() =>
                          setForm(prev => ({
                            ...prev,
                            approachingLimitPercent: clamp(
                              prev.approachingLimitPercent - PERCENT_STEP,
                              PERCENT_MIN,
                              PERCENT_MAX,
                            ),
                          }))
                        }
                        onIncrement={() =>
                          setForm(prev => ({
                            ...prev,
                            approachingLimitPercent: clamp(
                              prev.approachingLimitPercent + PERCENT_STEP,
                              PERCENT_MIN,
                              PERCENT_MAX,
                            ),
                          }))
                        }
                        minReached={form.approachingLimitPercent <= PERCENT_MIN}
                        maxReached={form.approachingLimitPercent >= PERCENT_MAX}
                        suffix="%"
                        testID="approaching-limit-percent-stepper"
                      />
                    </View>
                  )}
                </View>

                {/* Over pace this month */}
                <View
                  style={[
                    styles.card,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ]}
                  testID="over-pace-card"
                >
                  <ToggleRow
                    label="Over pace this month"
                    value={form.overPaceEnabled}
                    onValueChange={v => setForm(prev => ({ ...prev, overPaceEnabled: v }))}
                    testID="over-pace-toggle"
                  />
                </View>

                {/* Lease ends soon */}
                <View
                  style={[
                    styles.card,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ]}
                  testID="lease-end-card"
                >
                  <ToggleRow
                    label="Lease ends soon"
                    value={form.leaseEndEnabled}
                    onValueChange={v => setForm(prev => ({ ...prev, leaseEndEnabled: v }))}
                    testID="lease-end-toggle"
                  />
                  {form.leaseEndEnabled && (
                    <View testID="lease-end-stepper-container">
                      <Text
                        style={[styles.stepperLabel, { color: theme.colors.textSecondary }]}
                      >
                        {'Notify me this many days before my lease ends:'}
                      </Text>
                      <Stepper
                        value={form.leaseEndDays}
                        onDecrement={() =>
                          setForm(prev => ({
                            ...prev,
                            leaseEndDays: clamp(
                              prev.leaseEndDays - DAYS_STEP,
                              DAYS_MIN,
                              DAYS_MAX,
                            ),
                          }))
                        }
                        onIncrement={() =>
                          setForm(prev => ({
                            ...prev,
                            leaseEndDays: clamp(
                              prev.leaseEndDays + DAYS_STEP,
                              DAYS_MIN,
                              DAYS_MAX,
                            ),
                          }))
                        }
                        minReached={form.leaseEndDays <= DAYS_MIN}
                        maxReached={form.leaseEndDays >= DAYS_MAX}
                        suffix=" days"
                        testID="lease-end-days-stepper"
                      />
                    </View>
                  )}
                </View>

                {/* Saved trip coming up */}
                <View
                  style={[
                    styles.card,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ]}
                  testID="saved-trip-card"
                >
                  <ToggleRow
                    label="Saved trip coming up"
                    value={form.savedTripEnabled}
                    onValueChange={v => setForm(prev => ({ ...prev, savedTripEnabled: v }))}
                    testID="saved-trip-toggle"
                  />
                  <Text
                    style={[styles.cardNote, { color: theme.colors.textSecondary }]}
                    testID="saved-trip-note"
                  >
                    {'Notifies you 3 days before a saved trip date.'}
                  </Text>
                </View>

                {/* Mileage buy-back alert */}
                <View
                  style={[
                    styles.card,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ]}
                  testID="mileage-buyback-card"
                >
                  <ToggleRow
                    label="Mileage buy-back alert"
                    value={form.mileageBuybackEnabled}
                    onValueChange={v =>
                      setForm(prev => ({ ...prev, mileageBuybackEnabled: v }))
                    }
                    testID="mileage-buyback-toggle"
                  />
                  <Text
                    style={[styles.cardNote, { color: theme.colors.textSecondary }]}
                    testID="mileage-buyback-note"
                  >
                    {'Alerts you when projected overage cost exceeds the threshold so you can consider buying miles early.'}
                  </Text>
                  {form.mileageBuybackEnabled && (
                    <View testID="mileage-buyback-stepper-container">
                      <Text
                        style={[styles.stepperLabel, { color: theme.colors.textSecondary }]}
                      >
                        {'Notify when projected overage cost exceeds:'}
                      </Text>
                      <Stepper
                        value={form.mileageBuybackThresholdDollars}
                        onDecrement={() =>
                          setForm(prev => ({
                            ...prev,
                            mileageBuybackThresholdDollars: clamp(
                              prev.mileageBuybackThresholdDollars - DOLLARS_STEP,
                              DOLLARS_MIN,
                              DOLLARS_MAX,
                            ),
                          }))
                        }
                        onIncrement={() =>
                          setForm(prev => ({
                            ...prev,
                            mileageBuybackThresholdDollars: clamp(
                              prev.mileageBuybackThresholdDollars + DOLLARS_STEP,
                              DOLLARS_MIN,
                              DOLLARS_MAX,
                            ),
                          }))
                        }
                        minReached={form.mileageBuybackThresholdDollars <= DOLLARS_MIN}
                        maxReached={form.mileageBuybackThresholdDollars >= DOLLARS_MAX}
                        prefix="$"
                        suffix=""
                        testID="mileage-buyback-threshold-stepper"
                      />
                    </View>
                  )}
                </View>

                {/* Test notification (dev only) */}
                {__DEV__ && (
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    testID="test-notification-card"
                  >
                    <Text
                      style={[styles.devSectionTitle, { color: theme.colors.textSecondary }]}
                    >
                      {'DEVELOPMENT'}
                    </Text>
                    <Button
                      title={isSendingTest ? 'Sending…' : 'Test Notification'}
                      onPress={handleTestNotification}
                      variant="secondary"
                      disabled={isSendingTest}
                      testID="test-notification-button"
                    />
                  </View>
                )}
              </ScrollView>

              <View
                style={[
                  styles.footer,
                  {
                    backgroundColor: theme.colors.surface,
                    borderTopColor: theme.colors.border,
                  },
                ]}
              >
                <Button
                  title="Save"
                  onPress={handleSave}
                  isLoading={isSaving}
                  testID="alert-settings-save-button"
                />
              </View>
            </>
          )}
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
  },
  cardNote: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    flex: 1,
  },
  devSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  flex: {
    flex: 1,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  scrollContent: {
    paddingBottom: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginHorizontal: 16,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  stepperLabel: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
  },
});

