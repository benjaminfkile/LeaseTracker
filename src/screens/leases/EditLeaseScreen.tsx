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
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  deleteLease,
  getLease,
  getLeaseMembers,
  updateLease,
} from '../../api/leaseApi';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAuthStore } from '../../stores/authStore';
import { palette, useTheme } from '../../theme';
import type { LeaseStackNavigationProp, LeaseStackParamList } from '../../navigation/types';

const TOTAL_STEPS = 4;
const CURRENT_YEAR = new Date().getFullYear();

// ---------- Zod Schema ----------

const editLeaseSchema = z.object({
  // Step 1 — Vehicle
  display_name: z.string().min(1, 'Display name is required'),
  year: z
    .string()
    .min(1, 'Year is required')
    .refine(
      v => {
        const n = parseInt(v, 10);
        return !isNaN(n) && n >= 1990 && n <= CURRENT_YEAR + 2;
      },
      { message: `Year must be between 1990 and ${CURRENT_YEAR + 2}` },
    ),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  trim: z.string(),
  color: z.string(),
  vin: z
    .string()
    .refine(v => !v || v.length === 17, 'VIN must be exactly 17 characters'),
  license_plate: z.string(),

  // Step 2 — Lease Terms
  lease_start_date: z
    .string()
    .min(1, 'Start date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  lease_end_date: z
    .string()
    .min(1, 'End date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  miles_per_year: z
    .string()
    .min(1, 'Miles per year is required')
    .refine(v => {
      const n = parseInt(v, 10);
      return !isNaN(n) && n > 0;
    }, 'Must be a positive number'),
  total_miles_allowed: z
    .string()
    .min(1, 'Total miles is required')
    .refine(v => {
      const n = parseInt(v, 10);
      return !isNaN(n) && n > 0;
    }, 'Must be a positive number'),
  starting_odometer: z
    .string()
    .min(1, 'Starting odometer is required')
    .refine(v => {
      const n = parseInt(v, 10);
      return !isNaN(n) && n >= 0;
    }, 'Must be 0 or greater'),
  overage_cost_per_mile: z
    .string()
    .min(1, 'Overage cost is required')
    .refine(v => {
      const n = parseFloat(v);
      return !isNaN(n) && n >= 0;
    }, 'Must be 0 or greater'),

  // Step 3 — Optional Details
  monthly_payment: z.string(),
  dealer_name: z.string(),
  dealer_phone: z.string(),
  contract_number: z.string(),
  mpg_estimate: z.string(),
  notes: z.string(),
});

type EditLeaseFormData = z.infer<typeof editLeaseSchema>;

const STEP_TRIGGER_FIELDS: Record<number, (keyof EditLeaseFormData)[]> = {
  1: ['display_name', 'year', 'make', 'model', 'vin'],
  2: [
    'lease_start_date',
    'lease_end_date',
    'miles_per_year',
    'total_miles_allowed',
    'starting_odometer',
    'overage_cost_per_mile',
  ],
  3: [],
};

const STEP_TITLES = ['Vehicle Info', 'Lease Terms', 'Optional Details', 'Review & Save'];

// ---------- StepIndicator ----------

type StepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
};

function StepIndicator({
  currentStep,
  totalSteps,
}: StepIndicatorProps): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={stepStyles.container} testID="step-indicator">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;
        const filledDot = isCompleted || isActive;
        return (
          <React.Fragment key={step}>
            {i > 0 && (
              <View
                style={[
                  stepStyles.line,
                  {
                    backgroundColor:
                      step <= currentStep
                        ? theme.colors.primary
                        : theme.colors.border,
                  },
                ]}
                testID={`step-line-${i}`}
              />
            )}
            <View
              style={[
                stepStyles.dot,
                {
                  backgroundColor: filledDot
                    ? theme.colors.primary
                    : theme.colors.surface,
                  borderColor: filledDot
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
              testID={`step-dot-${step}`}
            >
              <Text
                style={[
                  stepStyles.dotText,
                  {
                    color: filledDot
                      ? palette.white
                      : theme.colors.textSecondary,
                  },
                ]}
              >
                {isCompleted ? '✓' : String(step)}
              </Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  dot: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  dotText: {
    fontSize: 12,
    fontWeight: '600',
  },
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
});

// ---------- DateField ----------

type DateFieldProps = {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  errorMessage?: string;
  minimumDate?: Date;
  testID?: string;
};

function DateField({
  label,
  value,
  onChange,
  errorMessage,
  minimumDate,
  testID,
}: DateFieldProps): React.ReactElement {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const displayValue = value ? dayjs(value).format('MMM D, YYYY') : 'Tap to select';
  const dateValue = value ? dayjs(value).toDate() : new Date();

  const handleChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (date) {
      onChange(dayjs(date).format('YYYY-MM-DD'));
    }
  };

  const borderColor = errorMessage
    ? theme.colors.error
    : showPicker
      ? theme.colors.primary
      : theme.colors.border;

  return (
    <View testID={testID}>
      <Text style={[dateFieldStyles.label, { color: theme.colors.textPrimary }]}>
        {label}
      </Text>
      <TouchableOpacity
        onPress={() => setShowPicker(p => !p)}
        style={[
          dateFieldStyles.touchable,
          { borderColor, backgroundColor: theme.colors.surface },
        ]}
        testID={`${testID ?? 'date-field'}-button`}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${displayValue}`}
      >
        <Text
          style={[
            dateFieldStyles.valueText,
            { color: value ? theme.colors.textPrimary : theme.colors.textSecondary },
          ]}
        >
          {displayValue}
        </Text>
        <Text style={[dateFieldStyles.calIcon, { color: theme.colors.textSecondary }]}>
          {'📅'}
        </Text>
      </TouchableOpacity>
      {errorMessage != null && (
        <Text
          style={[dateFieldStyles.error, { color: theme.colors.error }]}
          testID={`${testID ?? 'date-field'}-error`}
        >
          {errorMessage}
        </Text>
      )}
      {showPicker && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          minimumDate={minimumDate}
          testID={`${testID ?? 'date-field'}-picker`}
        />
      )}
    </View>
  );
}

const dateFieldStyles = StyleSheet.create({
  calIcon: {
    fontSize: 16,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  touchable: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  valueText: {
    fontSize: 16,
  },
});

// ---------- ReviewRow ----------

type ReviewRowProps = {
  label: string;
  value: string;
  testID?: string;
};

function ReviewRow({ label, value, testID }: ReviewRowProps): React.ReactElement {
  const theme = useTheme();
  if (!value) {
    return <View />;
  }
  return (
    <View style={reviewStyles.row} testID={testID}>
      <Text style={[reviewStyles.label, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[reviewStyles.value, { color: theme.colors.textPrimary }]}>
        {value}
      </Text>
    </View>
  );
}

const reviewStyles = StyleSheet.create({
  label: {
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
});

// ---------- EditLeaseScreen ----------

export function EditLeaseScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<LeaseStackNavigationProp>();
  const route = useRoute<RouteProp<LeaseStackParamList, 'EditLease'>>();
  const { leaseId } = route.params;
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(s => s.user);

  const [currentStep, setCurrentStep] = useState(1);
  const [dateOrderError, setDateOrderError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditLeaseFormData>({
    resolver: zodResolver(editLeaseSchema),
    defaultValues: {
      display_name: '',
      year: '',
      make: '',
      model: '',
      trim: '',
      color: '',
      vin: '',
      license_plate: '',
      lease_start_date: '',
      lease_end_date: '',
      miles_per_year: '',
      total_miles_allowed: '',
      starting_odometer: '',
      overage_cost_per_mile: '',
      monthly_payment: '',
      dealer_name: '',
      dealer_phone: '',
      contract_number: '',
      mpg_estimate: '',
      notes: '',
    },
  });

  const { data: lease, isLoading: leaseLoading } = useQuery({
    queryKey: ['lease', leaseId],
    queryFn: () => getLease(leaseId),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['lease-members', leaseId],
    queryFn: () => getLeaseMembers(leaseId),
  });

  // Pre-populate form when lease data loads.
  useEffect(() => {
    if (lease) {
      setValue('make', lease.make ?? '');
      setValue('model', lease.model ?? '');
      setValue('year', lease.year != null ? String(lease.year) : '');
      setValue('trim', lease.trim ?? '');
      setValue('color', lease.color ?? '');
      setValue('license_plate', lease.license_plate ?? '');
      setValue('display_name', lease.display_name);
      setValue('lease_start_date', lease.lease_start_date);
      setValue('lease_end_date', lease.lease_end_date);
      setValue('total_miles_allowed', String(lease.total_miles_allowed));
      setValue('miles_per_year', String(lease.miles_per_year));
      setValue('starting_odometer', String(lease.starting_odometer));
      setValue('overage_cost_per_mile', String(Number(lease.overage_cost_per_mile)));
      setValue('vin', lease.vin ?? '');
      setValue('monthly_payment', lease.monthly_payment != null ? String(lease.monthly_payment) : '');
      setValue('dealer_name', lease.dealer_name ?? '');
      setValue('dealer_phone', lease.dealer_phone ?? '');
      setValue('contract_number', lease.contract_number ?? '');
      setValue('mpg_estimate', '');
      setValue('notes', lease.notes ?? '');
    }
  }, [lease, setValue]);

  // Auto-calculate total_miles_allowed when dates or miles_per_year changes
  const leaseStartDate = watch('lease_start_date');
  const leaseEndDate = watch('lease_end_date');
  const milesPerYear = watch('miles_per_year');

  useEffect(() => {
    if (leaseStartDate && leaseEndDate && milesPerYear) {
      const start = dayjs(leaseStartDate);
      const end = dayjs(leaseEndDate);
      if (end.isAfter(start)) {
        const years = end.diff(start, 'year', true);
        const milesPerYearNum = parseInt(milesPerYear, 10);
        if (!isNaN(milesPerYearNum) && milesPerYearNum > 0) {
          const calculated = Math.round(years * milesPerYearNum);
          setValue('total_miles_allowed', String(calculated), { shouldValidate: false });
        }
      }
    }
  }, [leaseStartDate, leaseEndDate, milesPerYear, setValue]);

  const { mutate: submitUpdate, isPending } = useMutation({
    mutationFn: (data: Parameters<typeof updateLease>[1]) => updateLease(leaseId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leases'] });
      void queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      navigation.goBack();
    },
    onError: (err: Error) => {
      Alert.alert(
        'Error',
        err.message ?? 'Failed to update lease. Please try again.',
      );
    },
  });

  const { mutate: archiveLease, isPending: isArchiving } = useMutation({
    mutationFn: () => deleteLease(leaseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leases'] });
      navigation.navigate('LeaseList');
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message ?? 'Failed to archive lease. Please try again.');
    },
  });

  const handleArchive = () => {
    Alert.alert(
      'Archive Lease',
      'Are you sure you want to archive this lease? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => archiveLease(),
        },
      ],
    );
  };

  const isOwner = Boolean(lease && currentUser && lease.user_id === currentUser.sub);
  const viewerMembers = members.filter(m => m.role === 'viewer');
  const showTransferOwnership = isOwner && viewerMembers.length > 0;

  const handleTransferOwnership = () => {
    if (viewerMembers.length === 0) {
      Alert.alert(
        'Transfer Ownership',
        'No eligible members to transfer ownership to.',
      );
      return;
    }
    Alert.alert(
      'Transfer Ownership',
      'Select a member to transfer ownership to:',
      [
        ...viewerMembers.map(m => ({
          text: m.email,
          onPress: () => {
            Alert.alert(
              'Coming Soon',
              'Transfer ownership will be available in a future update.',
            );
          },
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );
  };

  const handleNext = async () => {
    const fields = STEP_TRIGGER_FIELDS[currentStep] ?? [];
    const valid = await trigger(fields as (keyof EditLeaseFormData)[]);

    if (currentStep === 2 && valid) {
      const { lease_start_date: sd, lease_end_date: ed } = getValues();
      if (sd && ed && ed <= sd) {
        setDateOrderError('End date must be after start date');
        return;
      }
      setDateOrderError(null);
    }

    if (valid) {
      setCurrentStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(s => s - 1);
    } else {
      navigation.goBack();
    }
  };

  const onSubmit = (data: EditLeaseFormData) => {
    const monthlyPayment = parseFloat(data.monthly_payment);
    submitUpdate({
      display_name: data.display_name,
      year: parseInt(data.year, 10),
      make: data.make || undefined,
      model: data.model || undefined,
      trim: data.trim || undefined,
      color: data.color || undefined,
      vin: data.vin || undefined,
      license_plate: data.license_plate || undefined,
      lease_start_date: data.lease_start_date,
      lease_end_date: data.lease_end_date,
      total_miles_allowed: parseInt(data.total_miles_allowed, 10),
      miles_per_year: parseInt(data.miles_per_year, 10),
      starting_odometer: parseInt(data.starting_odometer, 10) || undefined,
      overage_cost_per_mile: parseFloat(data.overage_cost_per_mile),
      monthly_payment: !isNaN(monthlyPayment) && monthlyPayment > 0 ? monthlyPayment : undefined,
      dealer_name: data.dealer_name || undefined,
      dealer_phone: data.dealer_phone || undefined,
      contract_number: data.contract_number || undefined,
      notes: data.notes || undefined,
    });
  };

  const reviewValues = getValues();

  if (leaseLoading) {
    return (
      <SafeAreaView
        style={[styles.flex, { backgroundColor: theme.colors.background }]}
        testID="edit-lease-screen"
      >
        <ScreenHeader title="Edit Lease" onBackPress={() => navigation.goBack()} />
        <View style={styles.loadingContainer} testID="edit-lease-loading">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      testID="edit-lease-screen"
    >
      <ScreenHeader
        title={`Step ${currentStep}: ${STEP_TITLES[currentStep - 1]}`}
        onBackPress={handleBack}
      />

      <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Step 1: Vehicle Info ── */}
          {currentStep === 1 && (
            <View key="step-1" testID="step-1-container">
              <Text
                style={[styles.stepTitle, { color: theme.colors.textPrimary }]}
                testID="step-1-title"
              >
                Vehicle Information
              </Text>

              <Controller
                control={control}
                name="display_name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Display Name *"
                    placeholder='e.g. "Daily Driver"'
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    errorMessage={errors.display_name?.message}
                    testID="input-display-name"
                  />
                )}
              />

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="year"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Year *"
                      placeholder="e.g. 2024"
                      keyboardType="number-pad"
                      maxLength={4}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      errorMessage={errors.year?.message}
                      testID="input-vehicle-year"
                    />
                  )}
                />
              </View>

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="make"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Make *"
                      placeholder="e.g. Toyota"
                      autoCapitalize="words"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      errorMessage={errors.make?.message}
                      testID="input-vehicle-make"
                    />
                  )}
                />
              </View>

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="model"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Model *"
                      placeholder="e.g. Camry"
                      autoCapitalize="words"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      errorMessage={errors.model?.message}
                      testID="input-vehicle-model"
                    />
                  )}
                />
              </View>

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="trim"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Trim"
                      placeholder="e.g. SE"
                      autoCapitalize="words"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      testID="input-vehicle-trim"
                    />
                  )}
                />
              </View>

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="color"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Color"
                      placeholder="e.g. Midnight Blue"
                      autoCapitalize="words"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      testID="input-vehicle-color"
                    />
                  )}
                />
              </View>

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="vin"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="VIN"
                      placeholder="17-character VIN"
                      autoCapitalize="characters"
                      autoCorrect={false}
                      maxLength={17}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      errorMessage={errors.vin?.message}
                      helperText="Leave blank if unknown"
                      testID="input-vin"
                    />
                  )}
                />
              </View>

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="license_plate"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="License Plate"
                      placeholder="e.g. ABC-1234"
                      autoCapitalize="characters"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      testID="input-license-plate"
                    />
                  )}
                />
              </View>
            </View>
          )}

          {/* ── Step 2: Lease Terms ── */}
          {currentStep === 2 && (
            <View key="step-2" testID="step-2-container">
              <Text
                style={[styles.stepTitle, { color: theme.colors.textPrimary }]}
                testID="step-2-title"
              >
                Lease Terms
              </Text>

              <Controller
                control={control}
                name="lease_start_date"
                render={({ field: { onChange, value } }) => (
                  <DateField
                    label="Lease Start Date *"
                    value={value}
                    onChange={onChange}
                    errorMessage={errors.lease_start_date?.message}
                    testID="date-field-start"
                  />
                )}
              />

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="lease_end_date"
                  render={({ field: { onChange, value } }) => (
                    <DateField
                      label="Lease End Date *"
                      value={value}
                      onChange={onChange}
                      errorMessage={
                        errors.lease_end_date?.message ?? dateOrderError ?? undefined
                      }
                      minimumDate={
                        leaseStartDate
                          ? dayjs(leaseStartDate).add(1, 'day').toDate()
                          : undefined
                      }
                      testID="date-field-end"
                    />
                  )}
                />
              </View>

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="miles_per_year"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Miles per Year *"
                      placeholder="e.g. 12000"
                      keyboardType="number-pad"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      errorMessage={errors.miles_per_year?.message}
                      testID="input-miles-per-year"
                    />
                  )}
                />
              </View>

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="total_miles_allowed"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Total Miles Allowed *"
                      placeholder="Auto-calculated (editable)"
                      keyboardType="number-pad"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      errorMessage={errors.total_miles_allowed?.message}
                      helperText="Auto-calculated from dates × miles/year"
                      testID="input-total-miles"
                    />
                  )}
                />
              </View>

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="starting_odometer"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Starting Odometer *"
                      placeholder="e.g. 15000"
                      keyboardType="number-pad"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      errorMessage={errors.starting_odometer?.message}
                      testID="input-starting-odometer"
                    />
                  )}
                />
              </View>

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="overage_cost_per_mile"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Overage Cost per Mile *"
                      placeholder="e.g. 0.25"
                      keyboardType="decimal-pad"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      errorMessage={errors.overage_cost_per_mile?.message}
                      helperText="Cost charged per mile over the allowed limit"
                      testID="input-overage-cost"
                    />
                  )}
                />
              </View>
            </View>
          )}

          {/* ── Step 3: Optional Details ── */}
          {currentStep === 3 && (
            <View key="step-3" testID="step-3-container">
              <Text
                style={[styles.stepTitle, { color: theme.colors.textPrimary }]}
                testID="step-3-title"
              >
                Optional Details
              </Text>
              <Text
                style={[styles.stepSubtitle, { color: theme.colors.textSecondary }]}
                testID="step-3-subtitle"
              >
                All fields in this step are optional.
              </Text>

              <Controller
                control={control}
                name="monthly_payment"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Monthly Payment ($)"
                    placeholder="e.g. 399.00"
                    keyboardType="decimal-pad"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    testID="input-monthly-payment"
                  />
                )}
              />

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="dealer_name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Dealer Name"
                      placeholder="e.g. City Toyota"
                      autoCapitalize="words"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      testID="input-dealer-name"
                    />
                  )}
                />
              </View>

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="dealer_phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Dealer Phone"
                      placeholder="e.g. (555) 123-4567"
                      keyboardType="phone-pad"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      testID="input-dealer-phone"
                    />
                  )}
                />
              </View>

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="contract_number"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Contract Number"
                      placeholder="e.g. LZ-2024-00123"
                      autoCapitalize="characters"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      testID="input-contract-number"
                    />
                  )}
                />
              </View>

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="mpg_estimate"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="MPG Estimate"
                      placeholder="e.g. 32"
                      keyboardType="decimal-pad"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      helperText="Used for carbon footprint estimation"
                      testID="input-mpg-estimate"
                    />
                  )}
                />
              </View>

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="notes"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Notes"
                      placeholder="Any additional notes..."
                      multiline
                      numberOfLines={4}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      testID="input-notes"
                    />
                  )}
                />
              </View>
            </View>
          )}

          {/* ── Step 4: Review & Save ── */}
          {currentStep === 4 && (
            <View key="step-4" testID="step-4-container">
              <Text
                style={[styles.stepTitle, { color: theme.colors.textPrimary }]}
                testID="step-4-title"
              >
                Review & Save
              </Text>
              <Text
                style={[styles.stepSubtitle, { color: theme.colors.textSecondary }]}
                testID="step-4-subtitle"
              >
                Please review your lease details before saving.
              </Text>

              <Card style={styles.reviewCard} testID="review-card-vehicle">
                <Text
                  style={[styles.reviewSectionTitle, { color: theme.colors.primary }]}
                  testID="review-section-vehicle"
                >
                  Vehicle
                </Text>
                <ReviewRow
                  label="Display Name"
                  value={reviewValues.display_name}
                  testID="review-display-name"
                />
                <ReviewRow
                  label="Year"
                  value={reviewValues.year}
                  testID="review-vehicle-year"
                />
                <ReviewRow
                  label="Make"
                  value={reviewValues.make}
                  testID="review-vehicle-make"
                />
                <ReviewRow
                  label="Model"
                  value={reviewValues.model}
                  testID="review-vehicle-model"
                />
                {!!reviewValues.trim && (
                  <ReviewRow
                    label="Trim"
                    value={reviewValues.trim}
                    testID="review-vehicle-trim"
                  />
                )}
                {!!reviewValues.color && (
                  <ReviewRow
                    label="Color"
                    value={reviewValues.color}
                    testID="review-vehicle-color"
                  />
                )}
                {!!reviewValues.vin && (
                  <ReviewRow label="VIN" value={reviewValues.vin} testID="review-vin" />
                )}
                {!!reviewValues.license_plate && (
                  <ReviewRow
                    label="License Plate"
                    value={reviewValues.license_plate}
                    testID="review-license-plate"
                  />
                )}
              </Card>

              <Card style={styles.reviewCard} testID="review-card-terms">
                <Text
                  style={[styles.reviewSectionTitle, { color: theme.colors.primary }]}
                  testID="review-section-terms"
                >
                  Lease Terms
                </Text>
                <ReviewRow
                  label="Start Date"
                  value={reviewValues.lease_start_date}
                  testID="review-start-date"
                />
                <ReviewRow
                  label="End Date"
                  value={reviewValues.lease_end_date}
                  testID="review-end-date"
                />
                <ReviewRow
                  label="Miles / Year"
                  value={reviewValues.miles_per_year}
                  testID="review-miles-per-year"
                />
                <ReviewRow
                  label="Total Miles"
                  value={reviewValues.total_miles_allowed}
                  testID="review-total-miles"
                />
                <ReviewRow
                  label="Starting Odometer"
                  value={reviewValues.starting_odometer}
                  testID="review-starting-odometer"
                />
                <ReviewRow
                  label="Overage $/Mile"
                  value={`$${reviewValues.overage_cost_per_mile}`}
                  testID="review-overage-cost"
                />
              </Card>

              {(!!reviewValues.monthly_payment ||
                !!reviewValues.dealer_name ||
                !!reviewValues.dealer_phone ||
                !!reviewValues.contract_number ||
                !!reviewValues.mpg_estimate ||
                !!reviewValues.notes) && (
                <Card style={styles.reviewCard} testID="review-card-optional">
                  <Text
                    style={[
                      styles.reviewSectionTitle,
                      { color: theme.colors.primary },
                    ]}
                    testID="review-section-optional"
                  >
                    Optional Details
                  </Text>
                  {!!reviewValues.monthly_payment && (
                    <ReviewRow
                      label="Monthly Payment"
                      value={`$${reviewValues.monthly_payment}`}
                      testID="review-monthly-payment"
                    />
                  )}
                  {!!reviewValues.dealer_name && (
                    <ReviewRow
                      label="Dealer Name"
                      value={reviewValues.dealer_name}
                      testID="review-dealer-name"
                    />
                  )}
                  {!!reviewValues.dealer_phone && (
                    <ReviewRow
                      label="Dealer Phone"
                      value={reviewValues.dealer_phone}
                      testID="review-dealer-phone"
                    />
                  )}
                  {!!reviewValues.contract_number && (
                    <ReviewRow
                      label="Contract #"
                      value={reviewValues.contract_number}
                      testID="review-contract-number"
                    />
                  )}
                  {!!reviewValues.mpg_estimate && (
                    <ReviewRow
                      label="MPG Estimate"
                      value={reviewValues.mpg_estimate}
                      testID="review-mpg"
                    />
                  )}
                  {!!reviewValues.notes && (
                    <ReviewRow
                      label="Notes"
                      value={reviewValues.notes}
                      testID="review-notes"
                    />
                  )}
                </Card>
              )}
            </View>
          )}

          {/* ── Lease Actions ── */}
          <View
            style={[
              styles.leaseActionsSection,
              { borderTopColor: theme.colors.border },
            ]}
            testID="lease-actions-section"
          >
            {showTransferOwnership && (
              <TouchableOpacity
                onPress={handleTransferOwnership}
                style={[
                  styles.actionButton,
                  { borderColor: theme.colors.primary },
                ]}
                testID="transfer-ownership-button"
                accessibilityRole="button"
                accessibilityLabel="Transfer ownership"
              >
                <Text
                  style={[styles.actionButtonText, { color: theme.colors.primary }]}
                >
                  Transfer Ownership
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleArchive}
              style={[styles.actionButton, { borderColor: theme.colors.error }]}
              disabled={isArchiving}
              testID="archive-lease-button"
              accessibilityRole="button"
              accessibilityLabel="Archive lease"
            >
              <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
                {isArchiving ? 'Archiving…' : 'Archive Lease'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* ── Navigation Buttons ── */}
        <View
          style={[
            styles.navButtons,
            {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border,
            },
          ]}
          testID="nav-buttons"
        >
          <View style={styles.navBack}>
            <Button
              title={currentStep === 1 ? 'Cancel' : 'Back'}
              variant="secondary"
              onPress={handleBack}
              testID="back-button"
            />
          </View>
          <View style={styles.navNext}>
            {currentStep < TOTAL_STEPS ? (
              <Button
                title="Next"
                onPress={() => {
                  void handleNext();
                }}
                testID="next-button"
              />
            ) : (
              <Button
                title="Save Changes"
                onPress={handleSubmit(onSubmit)}
                isLoading={isPending}
                testID="submit-button"
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  fieldSpacing: {
    marginTop: 16,
  },
  flex: {
    flex: 1,
  },
  leaseActionsSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 32,
    paddingBottom: 8,
    paddingTop: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  navBack: {
    flex: 1,
    marginRight: 8,
  },
  navButtons: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  navNext: {
    flex: 1,
    marginLeft: 8,
  },
  reviewCard: {
    marginBottom: 16,
  },
  reviewSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  stepSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
});
