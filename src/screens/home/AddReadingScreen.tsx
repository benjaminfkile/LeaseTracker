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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useController, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { z } from 'zod';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { OdometerInput } from '../../components/OdometerInput';
import { ReadingImpactCard } from '../../components/ReadingImpactCard';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useTheme } from '../../theme';
import { getLease } from '../../api/leaseApi';
import { addReading } from '../../api/readingsApi';
import type { HomeStackNavigationProp, HomeStackParamList } from '../../navigation/types';

// ---------- Schema ----------

const addReadingSchema = z.object({
  mileage: z
    .string()
    .min(1, 'Mileage is required')
    .regex(/^\d+$/, 'Enter a valid mileage'),
  readingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  note: z.string(),
});

type AddReadingFormData = z.infer<typeof addReadingSchema>;

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

// ---------- Screen ----------

export function AddReadingScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<HomeStackNavigationProp>();
  const route = useRoute<RouteProp<HomeStackParamList, 'AddReading'>>();
  const { leaseId } = route.params;
  const queryClient = useQueryClient();

  const today = dayjs().format('YYYY-MM-DD');

  const { data: lease } = useQuery({
    queryKey: ['lease', leaseId],
    queryFn: () => getLease(leaseId),
  });

  const { mutate: saveReading, isPending } = useMutation({
    mutationFn: (data: { odometer: number; reading_date: string; notes?: string }) =>
      addReading(leaseId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['readings', leaseId] });
      void queryClient.invalidateQueries({ queryKey: ['lease', leaseId] });
      navigation.goBack();
    },
    onError: (err: Error) => {
      Alert.alert('Error', err.message ?? 'Failed to save reading. Please try again.');
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<AddReadingFormData>({
    resolver: zodResolver(addReadingSchema),
    defaultValues: {
      mileage: '',
      readingDate: today,
      note: '',
    },
  });

  const { field: mileageField } = useController({ control, name: 'mileage' });
  const { field: readingDateField } = useController({ control, name: 'readingDate' });
  const { field: noteField } = useController({ control, name: 'note' });

  // Pre-fill mileage when returning from OCR camera screen
  useEffect(() => {
    if (route.params.initialMileage != null) {
      mileageField.onChange(String(route.params.initialMileage));
    }
  // mileageField.onChange is stable; only re-run when initialMileage changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params.initialMileage]);

  const watchedMileage = watch('mileage');
  const parsedNewMileage = watchedMileage.length > 0 ? parseInt(watchedMileage, 10) : null;
  const currentMileage = lease?.current_odometer ?? lease?.starting_odometer ?? 0;

  const onSubmit = (data: AddReadingFormData) => {
    const mileageNum = parseInt(data.mileage, 10);
    if (mileageNum <= currentMileage) {
      setError('mileage', {
        message: `Reading must be above current odometer (${currentMileage.toLocaleString()} mi)`,
      });
      return;
    }
    saveReading({
      odometer: mileageNum,
      reading_date: data.readingDate,
      notes: data.note.trim() !== '' ? data.note.trim() : undefined,
    });
  };

  const handleCameraPress = () => {
    navigation.navigate('OdometerCamera', { leaseId });
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="add-reading-screen"
    >
      <ScreenHeader title="Add Reading" onBackPress={() => navigation.goBack()} />
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
            testID="add-reading-title"
          >
            Odometer Reading
          </Text>

          <OdometerInput
            value={mileageField.value}
            onChange={mileageField.onChange}
            errorMessage={errors.mileage?.message}
            testID="odometer-input"
          />

          <View style={styles.cameraRow}>
            <TouchableOpacity
              style={[styles.cameraButton, { borderColor: theme.colors.border }]}
              onPress={handleCameraPress}
              accessibilityRole="button"
              testID="use-camera-button"
            >
              <Text style={[styles.cameraButtonText, { color: theme.colors.primary }]}>
                {'📷 Use Camera (OCR)'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <DateField
              label="Reading Date"
              value={readingDateField.value}
              onChange={readingDateField.onChange}
              testID="reading-date-field"
            />
          </View>

          <View style={styles.field}>
            <Input
              label="Notes (optional)"
              value={noteField.value}
              onChangeText={noteField.onChange}
              placeholder="Add a note..."
              multiline
              numberOfLines={3}
              testID="notes-input"
            />
          </View>

          <View style={styles.field}>
            <ReadingImpactCard
              lease={lease}
              currentMileage={currentMileage}
              newMileage={parsedNewMileage}
              testID="reading-impact-card"
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
            title="Save Reading"
            onPress={handleSubmit(onSubmit)}
            isLoading={isPending}
            testID="save-reading-button"
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  cameraButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cameraButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cameraRow: {
    alignItems: 'center',
    marginTop: 12,
  },
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
