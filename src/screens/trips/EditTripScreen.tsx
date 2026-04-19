import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useController, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { z } from 'zod';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { ScreenHeader } from '../../components/ScreenHeader';
import { getLeaseSummary } from '../../api/leaseApi';
import { deleteTrip, getTrips, updateTrip } from '../../api/tripsApi';
import { useTheme } from '../../theme';
import type { TripsStackNavigationProp, TripsStackParamList } from '../../navigation/types';

// ---------- Schema ----------

const editTripSchema = z.object({
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

type EditTripFormData = z.infer<typeof editTripSchema>;

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
  originalDistance: number | null;
  enteredDistance: number | null;
  testID?: string;
};

function TripImpactPreview({
  milesRemaining,
  originalDistance,
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

  // Reverse the original trip's impact on remaining miles, then apply the new distance
  const milesAfter = milesRemaining + (originalDistance ?? 0) - enteredDistance;

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

export function EditTripScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<TripsStackNavigationProp>();
  const route = useRoute<RouteProp<TripsStackParamList, 'EditTrip'>>();
  const { tripId, leaseId } = route.params;
  const queryClient = useQueryClient();

  const [completed, setCompleted] = useState(false);

  const { data: tripsData, isLoading: tripsLoading } = useQuery({
    queryKey: ['trips', leaseId],
    queryFn: () => getTrips(leaseId),
    enabled: leaseId !== '',
  });

  const { data: summaryData } = useQuery({
    queryKey: ['lease-summary', leaseId],
    queryFn: () => getLeaseSummary(leaseId),
    enabled: leaseId !== '',
  });

  const allTrips = [...(tripsData?.active ?? []), ...(tripsData?.completed ?? [])];
  const trip = allTrips.find(t => t.id === tripId);
  const isFromCompleted = (tripsData?.completed ?? []).some(t => t.id === tripId);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditTripFormData>({
    resolver: zodResolver(editTripSchema),
    defaultValues: {
      tripName: '',
      distance: '',
      tripDate: dayjs().format('YYYY-MM-DD'),
    },
  });

  useEffect(() => {
    if (trip) {
      reset({
        tripName: trip.name,
        distance: String(trip.estimated_miles),
        tripDate: trip.trip_date ?? dayjs().format('YYYY-MM-DD'),
      });
      setCompleted(trip.is_completed);
    }
  }, [trip, isFromCompleted, reset]);

  const { field: tripNameField } = useController({ control, name: 'tripName' });
  const { field: distanceField } = useController({ control, name: 'distance' });
  const { field: tripDateField } = useController({ control, name: 'tripDate' });

  const watchedDistance = watch('distance');
  const parsedDistance =
    watchedDistance.length > 0 ? parseFloat(watchedDistance) : null;

  const { mutate: saveTrip, isPending: isSaving } = useMutation({
    mutationFn: (data: {
      name: string;
      estimated_miles: number;
      trip_date: string;
      is_completed: boolean;
    }) => updateTrip(leaseId, tripId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['trips', leaseId] });
      void queryClient.invalidateQueries({ queryKey: ['lease-summary', leaseId] });
      navigation.goBack();
    },
    onError: (err: Error) => {
      Alert.alert(
        'Error',
        err.message ?? 'Failed to update trip. Please check your connection and try again.',
      );
    },
  });

  const { mutate: removeTrip, isPending: isDeleting } = useMutation({
    mutationFn: () => deleteTrip(leaseId, tripId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['trips', leaseId] });
      void queryClient.invalidateQueries({ queryKey: ['lease-summary', leaseId] });
      navigation.goBack();
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message ?? 'Failed to delete trip.');
    },
  });

  const onSubmit = (data: EditTripFormData) => {
    saveTrip({
      name: data.tripName.trim(),
      estimated_miles: parseFloat(data.distance),
      trip_date: data.tripDate,
      is_completed: completed,
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Trip',
      'Are you sure you want to delete this trip? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeTrip(),
        },
      ],
    );
  };

  if (tripsLoading) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        testID="edit-trip-screen"
      >
        <ScreenHeader title="Edit Trip" onBackPress={() => navigation.goBack()} />
        <ActivityIndicator
          style={styles.loader}
          size="large"
          color={theme.colors.primary}
          testID="edit-trip-loading"
        />
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="edit-trip-screen"
    >
      <ScreenHeader title="Edit Trip" onBackPress={() => navigation.goBack()} />
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
            testID="edit-trip-title"
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
              label="Trip Date"
              value={tripDateField.value}
              onChange={tripDateField.onChange}
              testID="trip-date-field"
            />
          </View>

          <View style={styles.field}>
            <TripImpactPreview
              milesRemaining={summaryData?.milesRemaining}
              originalDistance={trip?.estimated_miles ?? null}
              enteredDistance={parsedDistance}
              testID="trip-impact-preview"
            />
          </View>

          <View style={[styles.field, styles.toggleRow]}>
            <Text
              style={[styles.toggleLabel, { color: theme.colors.textPrimary }]}
              testID="mark-completed-label"
            >
              Mark as Completed
            </Text>
            <Switch
              value={completed}
              onValueChange={setCompleted}
              testID="mark-completed-toggle"
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
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
            title="Save Changes"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSaving}
            testID="save-trip-button"
          />
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteButton}
            testID="delete-trip-button"
            accessibilityRole="button"
            accessibilityLabel="Delete trip"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.error}
                testID="delete-loading-indicator"
              />
            ) : (
              <Text style={[styles.deleteText, { color: theme.colors.error }]}>
                Delete Trip
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  deleteButton: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 10,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '500',
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
  loader: {
    flex: 1,
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
  toggleLabel: {
    fontSize: 16,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

