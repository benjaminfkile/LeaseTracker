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
import { createAlert, getAlerts, updateAlert } from '../../api/alertsApi';
import { Button } from '../../components/Button';
import { ErrorMessage } from '../../components/ErrorMessage';
import { LeaseSelectorPills } from '../../components/LeaseSelectorPills';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useLeasesStore } from '../../stores/leasesStore';
import { useTheme } from '../../theme';
import type { AlertConfig } from '../../types/api';
import type { SettingsStackNavigationProp } from '../../navigation/types';

// ---------- Constants ----------

const DEFAULT_MILES_THRESHOLD_PERCENT = 80;
const DEFAULT_DAYS_REMAINING = 30;
const PERCENT_STEP = 5;
const DAYS_STEP = 1;
const PERCENT_MIN = 1;
const PERCENT_MAX = 100;
const DAYS_MIN = 1;
const DAYS_MAX = 365;

type AlertType = 'miles_threshold' | 'over_pace' | 'days_remaining';

// ---------- Helpers ----------

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

type AlertFormEntry = {
  id: string | null;
  is_enabled: boolean;
  threshold_value: number;
};

type FormState = {
  miles_threshold: AlertFormEntry;
  over_pace: AlertFormEntry;
  days_remaining: AlertFormEntry;
};

function defaultFormState(): FormState {
  return {
    miles_threshold: {
      id: null,
      is_enabled: false,
      threshold_value: DEFAULT_MILES_THRESHOLD_PERCENT,
    },
    over_pace: {
      id: null,
      is_enabled: false,
      threshold_value: 0,
    },
    days_remaining: {
      id: null,
      is_enabled: false,
      threshold_value: DEFAULT_DAYS_REMAINING,
    },
  };
}

function alertsToFormState(alerts: AlertConfig[]): FormState {
  const state = defaultFormState();
  for (const alert of alerts) {
    const entry = state[alert.alert_type];
    if (entry == null) {
      continue;
    }
    entry.id = alert.id;
    entry.is_enabled = alert.is_enabled;
    if (alert.threshold_value != null) {
      entry.threshold_value = alert.threshold_value;
    }
  }
  return state;
}

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

async function persistAlert(
  leaseId: string,
  alertType: AlertType,
  entry: AlertFormEntry,
  includeThreshold: boolean,
): Promise<void> {
  if (entry.id != null) {
    await updateAlert(leaseId, entry.id, {
      is_enabled: entry.is_enabled,
      threshold_value: includeThreshold ? entry.threshold_value : null,
    });
    return;
  }
  await createAlert(leaseId, {
    alert_type: alertType,
    is_enabled: entry.is_enabled,
    ...(includeThreshold ? { threshold_value: entry.threshold_value } : {}),
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
    data: alerts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['alert-config', selectedLeaseId],
    queryFn: () => getAlerts(selectedLeaseId),
    enabled: selectedLeaseId !== '',
  });

  useEffect(() => {
    if (alerts != null) {
      setForm(alertsToFormState(alerts));
    } else {
      setForm(defaultFormState());
    }
  }, [alerts]);

  const { mutate: saveConfig, isPending: isSaving } = useMutation({
    mutationFn: async (state: FormState) => {
      await Promise.all([
        persistAlert(selectedLeaseId, 'miles_threshold', state.miles_threshold, true),
        persistAlert(selectedLeaseId, 'over_pace', state.over_pace, false),
        persistAlert(selectedLeaseId, 'days_remaining', state.days_remaining, true),
      ]);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alert-config', selectedLeaseId] });
      Alert.alert('Saved', 'Alert settings have been saved.');
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message ?? 'Failed to save alert settings.');
    },
  });

  const handleSave = () => {
    saveConfig(form);
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

                {/* Approaching mileage limit (miles_threshold) */}
                <View
                  style={[
                    styles.card,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ]}
                  testID="miles-threshold-card"
                >
                  <ToggleRow
                    label="Approaching mileage limit"
                    value={form.miles_threshold.is_enabled}
                    onValueChange={v =>
                      setForm(prev => ({
                        ...prev,
                        miles_threshold: { ...prev.miles_threshold, is_enabled: v },
                      }))
                    }
                    testID="miles-threshold-toggle"
                  />
                  {form.miles_threshold.is_enabled && (
                    <View testID="miles-threshold-stepper-container">
                      <Text
                        style={[styles.stepperLabel, { color: theme.colors.textSecondary }]}
                      >
                        {"Notify when I've used this % of my mileage allowance:"}
                      </Text>
                      <Stepper
                        value={form.miles_threshold.threshold_value}
                        onDecrement={() =>
                          setForm(prev => ({
                            ...prev,
                            miles_threshold: {
                              ...prev.miles_threshold,
                              threshold_value: clamp(
                                prev.miles_threshold.threshold_value - PERCENT_STEP,
                                PERCENT_MIN,
                                PERCENT_MAX,
                              ),
                            },
                          }))
                        }
                        onIncrement={() =>
                          setForm(prev => ({
                            ...prev,
                            miles_threshold: {
                              ...prev.miles_threshold,
                              threshold_value: clamp(
                                prev.miles_threshold.threshold_value + PERCENT_STEP,
                                PERCENT_MIN,
                                PERCENT_MAX,
                              ),
                            },
                          }))
                        }
                        minReached={form.miles_threshold.threshold_value <= PERCENT_MIN}
                        maxReached={form.miles_threshold.threshold_value >= PERCENT_MAX}
                        suffix="%"
                        testID="miles-threshold-stepper"
                      />
                    </View>
                  )}
                </View>

                {/* Over pace this month (over_pace) */}
                <View
                  style={[
                    styles.card,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ]}
                  testID="over-pace-card"
                >
                  <ToggleRow
                    label="Over pace this month"
                    value={form.over_pace.is_enabled}
                    onValueChange={v =>
                      setForm(prev => ({
                        ...prev,
                        over_pace: { ...prev.over_pace, is_enabled: v },
                      }))
                    }
                    testID="over-pace-toggle"
                  />
                </View>

                {/* Lease ends soon (days_remaining) */}
                <View
                  style={[
                    styles.card,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ]}
                  testID="days-remaining-card"
                >
                  <ToggleRow
                    label="Lease ends soon"
                    value={form.days_remaining.is_enabled}
                    onValueChange={v =>
                      setForm(prev => ({
                        ...prev,
                        days_remaining: { ...prev.days_remaining, is_enabled: v },
                      }))
                    }
                    testID="days-remaining-toggle"
                  />
                  {form.days_remaining.is_enabled && (
                    <View testID="days-remaining-stepper-container">
                      <Text
                        style={[styles.stepperLabel, { color: theme.colors.textSecondary }]}
                      >
                        {'Notify me this many days before my lease ends:'}
                      </Text>
                      <Stepper
                        value={form.days_remaining.threshold_value}
                        onDecrement={() =>
                          setForm(prev => ({
                            ...prev,
                            days_remaining: {
                              ...prev.days_remaining,
                              threshold_value: clamp(
                                prev.days_remaining.threshold_value - DAYS_STEP,
                                DAYS_MIN,
                                DAYS_MAX,
                              ),
                            },
                          }))
                        }
                        onIncrement={() =>
                          setForm(prev => ({
                            ...prev,
                            days_remaining: {
                              ...prev.days_remaining,
                              threshold_value: clamp(
                                prev.days_remaining.threshold_value + DAYS_STEP,
                                DAYS_MIN,
                                DAYS_MAX,
                              ),
                            },
                          }))
                        }
                        minReached={form.days_remaining.threshold_value <= DAYS_MIN}
                        maxReached={form.days_remaining.threshold_value >= DAYS_MAX}
                        suffix=" days"
                        testID="days-remaining-stepper"
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
