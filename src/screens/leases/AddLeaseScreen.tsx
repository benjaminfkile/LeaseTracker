import React, { useEffect, useState } from 'react';
import {
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
import { useNavigation } from '@react-navigation/native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { createLease, getLeases } from '../../api/leaseApi';
import { getStatus } from '../../api/subscriptionApi';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { PremiumGate } from '../../components/PremiumGate';
import { ScreenHeader } from '../../components/ScreenHeader';
import { palette, useTheme } from '../../theme';
import type { LeaseStackNavigationProp } from '../../navigation/types';

const TOTAL_STEPS = 4;
const CURRENT_YEAR = new Date().getFullYear();

// ---------- Zod Schema ----------

const addLeaseSchema = z.object({
  // Step 1 — Vehicle
  displayName: z.string().min(1, 'Display name is required'),
  vehicleYear: z
    .string()
    .min(1, 'Year is required')
    .refine(
      v => {
        const n = parseInt(v, 10);
        return !isNaN(n) && n >= 1990 && n <= CURRENT_YEAR + 2;
      },
      { message: `Year must be between 1990 and ${CURRENT_YEAR + 2}` },
    ),
  vehicleMake: z.string().min(1, 'Make is required'),
  vehicleModel: z.string().min(1, 'Model is required'),
  vehicleTrim: z.string(),
  vehicleColor: z.string(),
  vin: z
    .string()
    .refine(v => !v || v.length === 17, 'VIN must be exactly 17 characters'),
  licensePlate: z.string(),

  // Step 2 — Lease Terms
  startDate: z
    .string()
    .min(1, 'Start date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  endDate: z
    .string()
    .min(1, 'End date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  milesPerYear: z
    .string()
    .min(1, 'Miles per year is required')
    .refine(v => {
      const n = parseInt(v, 10);
      return !isNaN(n) && n > 0;
    }, 'Must be a positive number'),
  totalMiles: z
    .string()
    .min(1, 'Total miles is required')
    .refine(v => {
      const n = parseInt(v, 10);
      return !isNaN(n) && n > 0;
    }, 'Must be a positive number'),
  startingOdometer: z
    .string()
    .min(1, 'Starting odometer is required')
    .refine(v => {
      const n = parseInt(v, 10);
      return !isNaN(n) && n >= 0;
    }, 'Must be 0 or greater'),
  overageCostPerMile: z
    .string()
    .min(1, 'Overage cost is required')
    .refine(v => {
      const n = parseFloat(v);
      return !isNaN(n) && n >= 0;
    }, 'Must be 0 or greater'),

  // Step 3 — Optional Details (all optional, no required constraint)
  monthlyPayment: z.string(),
  dealerName: z.string(),
  dealerPhone: z.string(),
  contractNumber: z.string(),
  mpgEstimate: z.string(),
  notes: z.string(),
});

type AddLeaseFormData = z.infer<typeof addLeaseSchema>;

// Fields to trigger validation for when advancing each step
const STEP_TRIGGER_FIELDS: Record<number, (keyof AddLeaseFormData)[]> = {
  1: ['displayName', 'vehicleYear', 'vehicleMake', 'vehicleModel', 'vin'],
  2: [
    'startDate',
    'endDate',
    'milesPerYear',
    'totalMiles',
    'startingOdometer',
    'overageCostPerMile',
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

// ---------- AddLeaseScreen ----------

export function AddLeaseScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<LeaseStackNavigationProp>();
  const queryClient = useQueryClient();

  const { data: subscription } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: getStatus,
  });

  const { data: leases } = useQuery({
    queryKey: ['leases'],
    queryFn: getLeases,
  });

  const isPremium = subscription?.isPremium ?? false;
  const leaseCount = leases?.length ?? 0;

  const handleUpgrade = () => {
    const parent = navigation.getParent();
    if (parent != null) {
      (parent.navigate as unknown as (screen: string, params: object) => void)('Settings', {
        screen: 'Subscription',
      });
    }
  };

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
  } = useForm<AddLeaseFormData>({
    resolver: zodResolver(addLeaseSchema),
    defaultValues: {
      displayName: '',
      vehicleYear: '',
      vehicleMake: '',
      vehicleModel: '',
      vehicleTrim: '',
      vehicleColor: '',
      vin: '',
      licensePlate: '',
      startDate: '',
      endDate: '',
      milesPerYear: '',
      totalMiles: '',
      startingOdometer: '',
      overageCostPerMile: '',
      monthlyPayment: '',
      dealerName: '',
      dealerPhone: '',
      contractNumber: '',
      mpgEstimate: '',
      notes: '',
    },
  });

  // Auto-calculate totalMiles when startDate, endDate, or milesPerYear changes
  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const milesPerYear = watch('milesPerYear');

  useEffect(() => {
    if (startDate && endDate && milesPerYear) {
      const start = dayjs(startDate);
      const end = dayjs(endDate);
      if (end.isAfter(start)) {
        const years = end.diff(start, 'year', true);
        const milesPerYearNum = parseInt(milesPerYear, 10);
        if (!isNaN(milesPerYearNum) && milesPerYearNum > 0) {
          const calculated = Math.round(years * milesPerYearNum);
          setValue('totalMiles', String(calculated), { shouldValidate: false });
        }
      }
    }
  }, [startDate, endDate, milesPerYear, setValue]);

  const { mutate: submitLease, isPending } = useMutation({
    mutationFn: createLease,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leases'] });
      navigation.goBack();
    },
    onError: (err: Error) => {
      Alert.alert(
        'Error',
        err.message ?? 'Failed to create lease. Please try again.',
      );
    },
  });

  const handleNext = async () => {
    const fields = STEP_TRIGGER_FIELDS[currentStep] ?? [];
    const valid = await trigger(fields as (keyof AddLeaseFormData)[]);

    if (currentStep === 2 && valid) {
      const { startDate: sd, endDate: ed } = getValues();
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

  const onSubmit = (data: AddLeaseFormData) => {
    const monthlyPaymentNum = parseFloat(data.monthlyPayment);
    submitLease({
      display_name: data.displayName,
      year: parseInt(data.vehicleYear, 10),
      make: data.vehicleMake,
      model: data.vehicleModel,
      trim: data.vehicleTrim || undefined,
      color: data.vehicleColor || undefined,
      vin: data.vin || undefined,
      license_plate: data.licensePlate || undefined,
      lease_start_date: data.startDate,
      lease_end_date: data.endDate,
      total_miles_allowed: parseInt(data.totalMiles, 10),
      miles_per_year: parseInt(data.milesPerYear, 10),
      starting_odometer: parseInt(data.startingOdometer, 10),
      overage_cost_per_mile: parseFloat(data.overageCostPerMile),
      monthly_payment: !isNaN(monthlyPaymentNum) && monthlyPaymentNum > 0 ? monthlyPaymentNum : undefined,
      dealer_name: data.dealerName || undefined,
      dealer_phone: data.dealerPhone || undefined,
      contract_number: data.contractNumber || undefined,
      notes: data.notes || undefined,
    });
  };

  const reviewValues = getValues();

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      testID="add-lease-screen"
    >
      <ScreenHeader
        title={`Step ${currentStep}: ${STEP_TITLES[currentStep - 1]}`}
        onBackPress={handleBack}
      />

      {!isPremium && leaseCount >= 2 ? (
        <PremiumGate
          isPremium={false}
          onUpgrade={handleUpgrade}
          description="You've used your 2 free leases. Upgrade to Premium for unlimited leases."
        >
          {null}
        </PremiumGate>
      ) : (
        <>
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
                name="displayName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Display Name *"
                    placeholder='e.g. "Daily Driver"'
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    errorMessage={errors.displayName?.message}
                    testID="input-display-name"
                  />
                )}
              />

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="vehicleYear"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Year *"
                      placeholder="e.g. 2024"
                      keyboardType="number-pad"
                      maxLength={4}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      errorMessage={errors.vehicleYear?.message}
                      testID="input-vehicle-year"
                    />
                  )}
                />
              </View>

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="vehicleMake"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Make *"
                      placeholder="e.g. Toyota"
                      autoCapitalize="words"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      errorMessage={errors.vehicleMake?.message}
                      testID="input-vehicle-make"
                    />
                  )}
                />
              </View>

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="vehicleModel"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Model *"
                      placeholder="e.g. Camry"
                      autoCapitalize="words"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      errorMessage={errors.vehicleModel?.message}
                      testID="input-vehicle-model"
                    />
                  )}
                />
              </View>

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="vehicleTrim"
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
                  name="vehicleColor"
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
                  name="licensePlate"
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
                name="startDate"
                render={({ field: { onChange, value } }) => (
                  <DateField
                    label="Lease Start Date *"
                    value={value}
                    onChange={onChange}
                    errorMessage={errors.startDate?.message}
                    testID="date-field-start"
                  />
                )}
              />

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="endDate"
                  render={({ field: { onChange, value } }) => (
                    <DateField
                      label="Lease End Date *"
                      value={value}
                      onChange={onChange}
                      errorMessage={
                        errors.endDate?.message ?? dateOrderError ?? undefined
                      }
                      minimumDate={
                        startDate
                          ? dayjs(startDate).add(1, 'day').toDate()
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
                  name="milesPerYear"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Miles per Year *"
                      placeholder="e.g. 12000"
                      keyboardType="number-pad"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      errorMessage={errors.milesPerYear?.message}
                      testID="input-miles-per-year"
                    />
                  )}
                />
              </View>

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="totalMiles"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Total Miles Allowed *"
                      placeholder="Auto-calculated (editable)"
                      keyboardType="number-pad"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      errorMessage={errors.totalMiles?.message}
                      helperText="Auto-calculated from dates × miles/year"
                      testID="input-total-miles"
                    />
                  )}
                />
              </View>

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="startingOdometer"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Starting Odometer *"
                      placeholder="e.g. 15000"
                      keyboardType="number-pad"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      errorMessage={errors.startingOdometer?.message}
                      testID="input-starting-odometer"
                    />
                  )}
                />
              </View>

              <View style={styles.fieldSpacing}>
                <Controller
                  control={control}
                  name="overageCostPerMile"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Overage Cost per Mile *"
                      placeholder="e.g. 0.25"
                      keyboardType="decimal-pad"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      errorMessage={errors.overageCostPerMile?.message}
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
                name="monthlyPayment"
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
                  name="dealerName"
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
                  name="dealerPhone"
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
                  name="contractNumber"
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
                  name="mpgEstimate"
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
                  value={reviewValues.displayName}
                  testID="review-display-name"
                />
                <ReviewRow
                  label="Year"
                  value={reviewValues.vehicleYear}
                  testID="review-vehicle-year"
                />
                <ReviewRow
                  label="Make"
                  value={reviewValues.vehicleMake}
                  testID="review-vehicle-make"
                />
                <ReviewRow
                  label="Model"
                  value={reviewValues.vehicleModel}
                  testID="review-vehicle-model"
                />
                {!!reviewValues.vehicleTrim && (
                  <ReviewRow
                    label="Trim"
                    value={reviewValues.vehicleTrim}
                    testID="review-vehicle-trim"
                  />
                )}
                {!!reviewValues.vehicleColor && (
                  <ReviewRow
                    label="Color"
                    value={reviewValues.vehicleColor}
                    testID="review-vehicle-color"
                  />
                )}
                {!!reviewValues.vin && (
                  <ReviewRow label="VIN" value={reviewValues.vin} testID="review-vin" />
                )}
                {!!reviewValues.licensePlate && (
                  <ReviewRow
                    label="License Plate"
                    value={reviewValues.licensePlate}
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
                  value={reviewValues.startDate}
                  testID="review-start-date"
                />
                <ReviewRow
                  label="End Date"
                  value={reviewValues.endDate}
                  testID="review-end-date"
                />
                <ReviewRow
                  label="Miles / Year"
                  value={reviewValues.milesPerYear}
                  testID="review-miles-per-year"
                />
                <ReviewRow
                  label="Total Miles"
                  value={reviewValues.totalMiles}
                  testID="review-total-miles"
                />
                <ReviewRow
                  label="Starting Odometer"
                  value={reviewValues.startingOdometer}
                  testID="review-starting-odometer"
                />
                <ReviewRow
                  label="Overage $/Mile"
                  value={`$${reviewValues.overageCostPerMile}`}
                  testID="review-overage-cost"
                />
              </Card>

              {(!!reviewValues.monthlyPayment ||
                !!reviewValues.dealerName ||
                !!reviewValues.dealerPhone ||
                !!reviewValues.contractNumber ||
                !!reviewValues.mpgEstimate ||
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
                  {!!reviewValues.monthlyPayment && (
                    <ReviewRow
                      label="Monthly Payment"
                      value={`$${reviewValues.monthlyPayment}`}
                      testID="review-monthly-payment"
                    />
                  )}
                  {!!reviewValues.dealerName && (
                    <ReviewRow
                      label="Dealer Name"
                      value={reviewValues.dealerName}
                      testID="review-dealer-name"
                    />
                  )}
                  {!!reviewValues.dealerPhone && (
                    <ReviewRow
                      label="Dealer Phone"
                      value={reviewValues.dealerPhone}
                      testID="review-dealer-phone"
                    />
                  )}
                  {!!reviewValues.contractNumber && (
                    <ReviewRow
                      label="Contract #"
                      value={reviewValues.contractNumber}
                      testID="review-contract-number"
                    />
                  )}
                  {!!reviewValues.mpgEstimate && (
                    <ReviewRow
                      label="MPG Estimate"
                      value={reviewValues.mpgEstimate}
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
                title="Add Lease"
                onPress={handleSubmit(onSubmit)}
                isLoading={isPending}
                testID="submit-button"
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fieldSpacing: {
    marginTop: 16,
  },
  flex: {
    flex: 1,
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
