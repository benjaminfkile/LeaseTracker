import React, { useEffect, useRef, useState } from 'react';
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
import { getAlertConfigs, updateAlertConfig } from '../../api/alertsApi';
import { Button } from '../../components/Button';
import { ErrorMessage } from '../../components/ErrorMessage';
import { LeaseSelectorPills } from '../../components/LeaseSelectorPills';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useLeasesStore } from '../../stores/leasesStore';
import { useTheme } from '../../theme';
import type { AlertConfig, UpdateAlertConfigInput } from '../../types/api';
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

// ---------- Helpers ----------

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function findByType(
  configs: AlertConfig[],
  alertType: AlertConfig['alert_type'],
): AlertConfig | undefined {
  return configs.find(c => c.alert_type === alertType);
}

// ---------- Types ----------

type FormState = {
  milesThresholdEnabled: boolean;
  milesThresholdValue: number;
  overPaceEnabled: boolean;
  daysRemainingEnabled: boolean;
  daysRemainingValue: number;
};

function configsToFormState(configs: AlertConfig[]): FormState {
  const miles = findByType(configs, 'miles_threshold');
  const overPace = findByType(configs, 'over_pace');
  const days = findByType(configs, 'days_remaining');

  return {
    milesThresholdEnabled: miles?.is_enabled ?? false,
    milesThresholdValue: miles?.threshold_value ?? DEFAULT_MILES_THRESHOLD_PERCENT,
    overPaceEnabled: overPace?.is_enabled ?? false,
    daysRemainingEnabled: days?.is_enabled ?? false,
    daysRemainingValue: days?.threshold_value ?? DEFAULT_DAYS_REMAINING,
  };
}

function defaultFormState(): FormState {
  return {
    milesThresholdEnabled: false,
    milesThresholdValue: DEFAULT_MILES_THRESHOLD_PERCENT,
    overPaceEnabled: false,
    daysRemainingEnabled: false,
    daysRemainingValue: DEFAULT_DAYS_REMAINING,
  };
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

export function AlertSettingsScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<SettingsStackNavigationProp>();
  const queryClient = useQueryClient();

  const leases = useLeasesStore(state => state.leases);
  const activeLeaseId = useLeasesStore(state => state.activeLeaseId);

  const defaultLeaseId = activeLeaseId ?? leases[0]?.id ?? '';
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>(defaultLeaseId);
  const [form, setForm] = useState<FormState>(defaultFormState());
  const loadedConfigsRef = useRef<AlertConfig[]>([]);

  const {
    data: alertConfigs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['alert-configs', selectedLeaseId],
    queryFn: () => getAlertConfigs(selectedLeaseId),
    enabled: selectedLeaseId !== '',
  });

  useEffect(() => {
    if (alertConfigs != null && alertConfigs.length > 0) {
      loadedConfigsRef.current = alertConfigs;
      setForm(configsToFormState(alertConfigs));
    } else {
      loadedConfigsRef.current = [];
      setForm(defaultFormState());
    }
  }, [alertConfigs]);

  const { mutate: saveConfigs, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      const configs = loadedConfigsRef.current;
      const updates: Promise<AlertConfig>[] = [];

      const miles = findByType(configs, 'miles_threshold');
      if (miles != null) {
        const changed =
          miles.is_enabled !== form.milesThresholdEnabled ||
          miles.threshold_value !== form.milesThresholdValue;
        if (changed) {
          updates.push(
            updateAlertConfig(selectedLeaseId, miles.id, {
              is_enabled: form.milesThresholdEnabled,
              threshold_value: form.milesThresholdValue,
            }),
          );
        }
      }

      const overPace = findByType(configs, 'over_pace');
      if (overPace != null) {
        const changed = overPace.is_enabled !== form.overPaceEnabled;
        if (changed) {
          updates.push(
            updateAlertConfig(selectedLeaseId, overPace.id, {
              is_enabled: form.overPaceEnabled,
            }),
          );
        }
      }

      const days = findByType(configs, 'days_remaining');
      if (days != null) {
        const changed =
          days.is_enabled !== form.daysRemainingEnabled ||
          days.threshold_value !== form.daysRemainingValue;
        if (changed) {
          updates.push(
            updateAlertConfig(selectedLeaseId, days.id, {
              is_enabled: form.daysRemainingEnabled,
              threshold_value: form.daysRemainingValue,
            }),
          );
        }
      }

      await Promise.all(updates);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['alert-configs', selectedLeaseId] });
      Alert.alert('Saved', 'Alert settings have been saved.');
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message ?? 'Failed to save alert settings.');
    },
  });

  const handleSave = () => {
    saveConfigs();
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
                  queryKey: ['alert-configs', selectedLeaseId],
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

                {/* Miles Threshold */}
                <View
                  style={[
                    styles.card,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ]}
                  testID="miles-threshold-card"
                >
                  <ToggleRow
                    label="Miles threshold"
                    value={form.milesThresholdEnabled}
                    onValueChange={v =>
                      setForm(prev => ({ ...prev, milesThresholdEnabled: v }))
                    }
                    testID="miles-threshold-toggle"
                  />
                  {form.milesThresholdEnabled && (
                    <View testID="miles-threshold-stepper-container">
                      <Text
                        style={[styles.stepperLabel, { color: theme.colors.textSecondary }]}
                      >
                        {"Notify when I've used this % of my mileage allowance:"}
                      </Text>
                      <Stepper
                        value={form.milesThresholdValue}
                        onDecrement={() =>
                          setForm(prev => ({
                            ...prev,
                            milesThresholdValue: clamp(
                              prev.milesThresholdValue - PERCENT_STEP,
                              PERCENT_MIN,
                              PERCENT_MAX,
                            ),
                          }))
                        }
                        onIncrement={() =>
                          setForm(prev => ({
                            ...prev,
                            milesThresholdValue: clamp(
                              prev.milesThresholdValue + PERCENT_STEP,
                              PERCENT_MIN,
                              PERCENT_MAX,
                            ),
                          }))
                        }
                        minReached={form.milesThresholdValue <= PERCENT_MIN}
                        maxReached={form.milesThresholdValue >= PERCENT_MAX}
                        suffix="%"
                        testID="miles-threshold-stepper"
                      />
                    </View>
                  )}
                </View>

                {/* Over Pace */}
                <View
                  style={[
                    styles.card,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ]}
                  testID="over-pace-card"
                >
                  <ToggleRow
                    label="Over pace"
                    value={form.overPaceEnabled}
                    onValueChange={v => setForm(prev => ({ ...prev, overPaceEnabled: v }))}
                    testID="over-pace-toggle"
                  />
                </View>

                {/* Days Remaining */}
                <View
                  style={[
                    styles.card,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ]}
                  testID="days-remaining-card"
                >
                  <ToggleRow
                    label="Days remaining"
                    value={form.daysRemainingEnabled}
                    onValueChange={v => setForm(prev => ({ ...prev, daysRemainingEnabled: v }))}
                    testID="days-remaining-toggle"
                  />
                  {form.daysRemainingEnabled && (
                    <View testID="days-remaining-stepper-container">
                      <Text
                        style={[styles.stepperLabel, { color: theme.colors.textSecondary }]}
                      >
                        {'Notify me this many days before my lease ends:'}
                      </Text>
                      <Stepper
                        value={form.daysRemainingValue}
                        onDecrement={() =>
                          setForm(prev => ({
                            ...prev,
                            daysRemainingValue: clamp(
                              prev.daysRemainingValue - DAYS_STEP,
                              DAYS_MIN,
                              DAYS_MAX,
                            ),
                          }))
                        }
                        onIncrement={() =>
                          setForm(prev => ({
                            ...prev,
                            daysRemainingValue: clamp(
                              prev.daysRemainingValue + DAYS_STEP,
                              DAYS_MIN,
                              DAYS_MAX,
                            ),
                          }))
                        }
                        minReached={form.daysRemainingValue <= DAYS_MIN}
                        maxReached={form.daysRemainingValue >= DAYS_MAX}
                        suffix=" days"
                        testID="days-remaining-stepper"
                      />
                    </View>
                  )}
                </View>
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
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    flex: 1,
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
