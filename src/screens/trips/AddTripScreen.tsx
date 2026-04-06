import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useController, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { z } from 'zod';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ScreenHeader } from '../../components/ScreenHeader';
import { getLeaseSummary } from '../../api/leaseApi';
import { createTrip } from '../../api/tripsApi';
import { useLeasesStore } from '../../stores/leasesStore';
import { useTheme } from '../../theme';
import type { TripsStackNavigationProp } from '../../navigation/types';

// ---------- Schema ----------

const addTripSchema = z.object({
  tripName: z.string().min(1, 'Trip name is required'),
  distance: z
    .string()
    .min(1, 'Estimated miles is required')
    .refine(val => {
      const n = parseFloat(val);
      return !isNaN(n) && n > 0;
    }, 'Estimated miles must be greater than 0'),
  tripDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
});

type AddTripFormData = z.infer<typeof addTripSchema>;

// ---------- DateField ----------

type DateFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  testID?: string;
};

function DateField({
  label,
  value,
  onChange,
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

  const borderColor = showPicker ? theme.colors.primary : theme.colors.border;

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
      {showPicker && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          maximumDate={new Date()}
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

// ---------- TripImpactPreview ----------

type TripImpactPreviewProps = {
  milesRemaining: number | undefined;
  enteredDistance: number | null;
  testID?: string;
};

function TripImpactPreview({
  milesRemaining,
  enteredDistance,
  testID,
}: TripImpactPreviewProps): React.ReactElement {
  const theme = useTheme();

  if (milesRemaining === undefined || enteredDistance === null || enteredDistance <= 0) {
    return (
      <View
        style={[
          impactStyles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
        testID={testID}
      >
        <Text
          style={[impactStyles.title, { color: theme.colors.textSecondary }]}
          testID="trip-impact-preview-placeholder"
        >
          Enter miles to see impact on your budget
        </Text>
      </View>
    );
  }

  const milesAfter = milesRemaining - enteredDistance;

  return (
    <View
      style={[
        impactStyles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
      testID={testID}
    >
      <Text
        style={[impactStyles.previewText, { color: theme.colors.textPrimary }]}
        testID="trip-impact-preview-text"
      >
        {`After saving this trip, you'll have `}
        <Text
          style={[
            impactStyles.milesValue,
            { color: milesAfter >= 0 ? theme.colors.primary : theme.colors.error },
          ]}
          testID="trip-impact-preview-miles"
        >
          {`${milesAfter.toLocaleString()} mi`}
        </Text>
        {' available'}
      </Text>
    </View>
  );
}

const impactStyles = StyleSheet.create({
  card: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
  },
  milesValue: {
    fontWeight: '700',
  },
  previewText: {
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    fontSize: 13,
    textAlign: 'center',
  },
});

// ---------- Screen ----------

export function AddTripScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<TripsStackNavigationProp>();
  const activeLeaseId = useLeasesStore(state => state.activeLeaseId);
  const leases = useLeasesStore(state => state.leases);
  const queryClient = useQueryClient();

  const leaseId = activeLeaseId ?? leases[0]?.id ?? '';
  const today = dayjs().format('YYYY-MM-DD');

  const { data: summaryData } = useQuery({
    queryKey: ['lease-summary', leaseId],
    queryFn: () => getLeaseSummary(leaseId),
    enabled: leaseId !== '',
  });

  const { mutate: saveTrip, isPending } = useMutation({
    mutationFn: (data: { distance: number; tripDate: string; note: string }) =>
      createTrip(leaseId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['trips', leaseId] });
      void queryClient.invalidateQueries({ queryKey: ['lease-summary', leaseId] });
      navigation.goBack();
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message ?? 'Failed to save trip. Please try again.');
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AddTripFormData>({
    resolver: zodResolver(addTripSchema),
    defaultValues: {
      tripName: '',
      distance: '',
      tripDate: today,
    },
  });

  const { field: tripNameField } = useController({ control, name: 'tripName' });
  const { field: distanceField } = useController({ control, name: 'distance' });
  const { field: tripDateField } = useController({ control, name: 'tripDate' });

  const watchedDistance = watch('distance');
  const parsedDistance =
    watchedDistance.length > 0 ? parseFloat(watchedDistance) : null;

  const onSubmit = (data: AddTripFormData) => {
    saveTrip({
      distance: parseFloat(data.distance),
      tripDate: data.tripDate,
      note: data.tripName.trim(),
    });
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="add-trip-screen"
    >
      <ScreenHeader title="Add Trip" onBackPress={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}
            testID="add-trip-title"
          >
            Trip Details
          </Text>

          <Input
            label="Trip Name"
            value={tripNameField.value}
            onChangeText={tripNameField.onChange}
            placeholder="e.g. Road trip to Denver"
            errorMessage={errors.tripName?.message}
            testID="trip-name-input"
          />

          <View style={styles.field}>
            <Input
              label="Estimated Miles"
              value={distanceField.value}
              onChangeText={distanceField.onChange}
              placeholder="e.g. 250"
              keyboardType="decimal-pad"
              errorMessage={errors.distance?.message}
              testID="distance-input"
            />
          </View>

          <View style={styles.field}>
            <DateField
              label="Trip Date (optional)"
              value={tripDateField.value}
              onChange={tripDateField.onChange}
              testID="trip-date-field"
            />
          </View>

          <View style={styles.field}>
            <TripImpactPreview
              milesRemaining={summaryData?.milesRemaining}
              enteredDistance={parsedDistance}
              testID="trip-impact-preview"
            />
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
            title="Save Trip"
            onPress={handleSubmit(onSubmit)}
            isLoading={isPending}
            testID="save-trip-button"
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  field: {
    marginTop: 20,
  },
  flex: {
    flex: 1,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
});
