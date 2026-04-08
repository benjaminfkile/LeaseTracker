import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Button } from '../../components/Button';
import { useTheme } from '../../theme';
import type { LeaseStackNavigationProp, LeaseStackParamList } from '../../navigation/types';

type ItemStatus = 'ok' | 'minor' | 'damage' | null;

type ChecklistItem = {
  id: string;
  label: string;
  status: ItemStatus;
  photoUri: string | null;
};

type ChecklistCategory = {
  id: string;
  title: string;
  icon: string;
  items: ChecklistItem[];
};

const INITIAL_CATEGORIES: ChecklistCategory[] = [
  {
    id: 'exterior',
    title: 'Exterior Damage',
    icon: 'car-side',
    items: [
      { id: 'ext-paint', label: 'Paint Condition', status: null, photoUri: null },
      { id: 'ext-dents', label: 'Dents & Dings', status: null, photoUri: null },
      { id: 'ext-scratches', label: 'Scratches', status: null, photoUri: null },
      { id: 'ext-bumpers', label: 'Bumpers', status: null, photoUri: null },
      { id: 'ext-lights', label: 'Headlights & Taillights', status: null, photoUri: null },
      { id: 'ext-mirrors', label: 'Side Mirrors', status: null, photoUri: null },
    ],
  },
  {
    id: 'interior',
    title: 'Interior Condition',
    icon: 'car-seat',
    items: [
      { id: 'int-seats', label: 'Seats & Upholstery', status: null, photoUri: null },
      { id: 'int-carpet', label: 'Carpet & Floor Mats', status: null, photoUri: null },
      { id: 'int-dash', label: 'Dashboard & Console', status: null, photoUri: null },
      { id: 'int-steering', label: 'Steering Wheel', status: null, photoUri: null },
      { id: 'int-headliner', label: 'Headliner', status: null, photoUri: null },
      { id: 'int-odors', label: 'Odors & Stains', status: null, photoUri: null },
    ],
  },
  {
    id: 'tires',
    title: 'Tires',
    icon: 'tire',
    items: [
      { id: 'tire-fl', label: 'Front Left Tire', status: null, photoUri: null },
      { id: 'tire-fr', label: 'Front Right Tire', status: null, photoUri: null },
      { id: 'tire-rl', label: 'Rear Left Tire', status: null, photoUri: null },
      { id: 'tire-rr', label: 'Rear Right Tire', status: null, photoUri: null },
      { id: 'tire-spare', label: 'Spare Tire', status: null, photoUri: null },
    ],
  },
  {
    id: 'windshield',
    title: 'Windshield',
    icon: 'car-windshield',
    items: [
      { id: 'ws-front', label: 'Front Windshield', status: null, photoUri: null },
      { id: 'ws-rear', label: 'Rear Windshield', status: null, photoUri: null },
      { id: 'ws-wipers', label: 'Wiper Blades', status: null, photoUri: null },
      { id: 'ws-chips', label: 'Chips & Cracks', status: null, photoUri: null },
    ],
  },
  {
    id: 'wear',
    title: 'Excess Wear Items',
    icon: 'wrench',
    items: [
      { id: 'wear-brakes', label: 'Brake Pads', status: null, photoUri: null },
      { id: 'wear-battery', label: 'Battery', status: null, photoUri: null },
      { id: 'wear-exhaust', label: 'Exhaust System', status: null, photoUri: null },
      { id: 'wear-suspension', label: 'Suspension', status: null, photoUri: null },
      { id: 'wear-ac', label: 'A/C & Heating', status: null, photoUri: null },
    ],
  },
  {
    id: 'keys',
    title: 'Keys & Remotes',
    icon: 'key-variant',
    items: [
      { id: 'key-primary', label: 'Primary Key Fob', status: null, photoUri: null },
      { id: 'key-spare', label: 'Spare Key Fob', status: null, photoUri: null },
      { id: 'key-valet', label: 'Valet Key', status: null, photoUri: null },
    ],
  },
];

const STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: 'ok', label: 'OK' },
  { value: 'minor', label: 'Minor' },
  { value: 'damage', label: 'Damage' },
];

function getStatusColor(status: ItemStatus, colors: { success: string; warning: string; error: string; border: string }): string {
  switch (status) {
    case 'ok': return colors.success;
    case 'minor': return colors.warning;
    case 'damage': return colors.error;
    default: return colors.border;
  }
}

function getStatusIcon(status: ItemStatus): string {
  switch (status) {
    case 'ok': return 'check-circle';
    case 'minor': return 'alert-circle';
    case 'damage': return 'close-circle';
    default: return 'circle-outline';
  }
}

export function TurnInChecklistScreen(): React.ReactElement {
  const theme = useTheme();
  const navigation = useNavigation<LeaseStackNavigationProp>();
  const route = useRoute<RouteProp<LeaseStackParamList, 'TurnInChecklist'>>();
  const { leaseId: _leaseId } = route.params;
  const viewShotRef = useRef<ViewShot>(null);

  const [categories, setCategories] = useState<ChecklistCategory[]>(INITIAL_CATEGORIES);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['exterior']));
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const updateItemStatus = useCallback((categoryId: string, itemId: string, status: ItemStatus) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map(item =>
                item.id === itemId ? { ...item, status } : item,
              ),
            }
          : cat,
      ),
    );
  }, []);

  const handleAddPhoto = useCallback((categoryId: string, itemId: string) => {
    Alert.alert('Add Photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: () => {
          void launchCamera({ mediaType: 'photo', quality: 0.8 }, response => {
            if (response.assets?.[0]?.uri) {
              setCategories(prev =>
                prev.map(cat =>
                  cat.id === categoryId
                    ? {
                        ...cat,
                        items: cat.items.map(item =>
                          item.id === itemId
                            ? { ...item, photoUri: response.assets![0].uri! }
                            : item,
                        ),
                      }
                    : cat,
                ),
              );
            }
          });
        },
      },
      {
        text: 'Photo Library',
        onPress: () => {
          void launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, response => {
            if (response.assets?.[0]?.uri) {
              setCategories(prev =>
                prev.map(cat =>
                  cat.id === categoryId
                    ? {
                        ...cat,
                        items: cat.items.map(item =>
                          item.id === itemId
                            ? { ...item, photoUri: response.assets![0].uri! }
                            : item,
                        ),
                      }
                    : cat,
                ),
              );
            }
          });
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  const removePhoto = useCallback((categoryId: string, itemId: string) => {
    setCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map(item =>
                item.id === itemId ? { ...item, photoUri: null } : item,
              ),
            }
          : cat,
      ),
    );
  }, []);

  const handleGenerateReport = useCallback(async () => {
    setIsGenerating(true);
    // Expand all categories so report captures everything
    setExpandedCategories(new Set(categories.map(c => c.id)));

    // Give a tick for the state to render
    await new Promise<void>(resolve => setTimeout(resolve, 300));

    try {
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1,
      });

      await Share.share(
        Platform.OS === 'ios'
          ? { url: uri }
          : { title: 'Lease Turn-In Checklist', message: 'Lease Turn-In Checklist Report', url: uri },
      );
    } catch {
      Alert.alert('Error', 'Failed to generate the checklist report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [categories]);

  const completedCount = categories.reduce(
    (sum, cat) => sum + cat.items.filter(i => i.status != null).length,
    0,
  );
  const totalCount = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const hasIssues = categories.some(cat =>
    cat.items.some(i => i.status === 'minor' || i.status === 'damage'),
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      testID="turn-in-checklist-screen"
    >
      <ScreenHeader
        title="Turn-In Checklist"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={{ backgroundColor: theme.colors.background }}>
          {/* Progress Summary */}
          <View
            style={[styles.progressCard, { backgroundColor: theme.colors.surface }]}
            testID="checklist-progress"
          >
            <View style={styles.progressRow}>
              <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
                Progress
              </Text>
              <Text style={[styles.progressCount, { color: theme.colors.textPrimary }]}>
                {completedCount} / {totalCount} items
              </Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: theme.colors.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: hasIssues ? theme.colors.warning : theme.colors.success,
                    width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%',
                  },
                ]}
              />
            </View>
            {hasIssues && (
              <View style={styles.issueWarning}>
                <MaterialCommunityIcons name="alert" size={16} color={theme.colors.warning} />
                <Text style={[styles.issueWarningText, { color: theme.colors.warning }]}>
                  Issues found — document with photos before turn-in
                </Text>
              </View>
            )}
          </View>

          {/* Categories */}
          {categories.map(category => {
            const isExpanded = expandedCategories.has(category.id);
            const catCompleted = category.items.filter(i => i.status != null).length;
            const catTotal = category.items.length;
            const catHasIssues = category.items.some(
              i => i.status === 'minor' || i.status === 'damage',
            );

            return (
              <View
                key={category.id}
                style={[styles.categoryCard, { backgroundColor: theme.colors.surface }]}
                testID={`checklist-category-${category.id}`}
              >
                {/* Category Header */}
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category.id)}
                  activeOpacity={0.7}
                  testID={`checklist-category-toggle-${category.id}`}
                >
                  <View style={styles.categoryHeaderLeft}>
                    <MaterialCommunityIcons
                      name={category.icon}
                      size={22}
                      color={theme.colors.primary}
                    />
                    <Text style={[styles.categoryTitle, { color: theme.colors.textPrimary }]}>
                      {category.title}
                    </Text>
                  </View>
                  <View style={styles.categoryHeaderRight}>
                    <Text style={[styles.categoryCount, { color: theme.colors.textSecondary }]}>
                      {catCompleted}/{catTotal}
                    </Text>
                    {catHasIssues && (
                      <MaterialCommunityIcons
                        name="alert-circle"
                        size={16}
                        color={theme.colors.warning}
                        style={styles.categoryWarningIcon}
                      />
                    )}
                    <MaterialCommunityIcons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={22}
                      color={theme.colors.textSecondary}
                    />
                  </View>
                </TouchableOpacity>

                {/* Category Items */}
                {isExpanded &&
                  category.items.map((item, index) => (
                    <View
                      key={item.id}
                      style={[
                        styles.checklistItem,
                        {
                          borderTopColor: theme.colors.border,
                          borderTopWidth: index === 0 ? StyleSheet.hairlineWidth : 0,
                          borderBottomColor: theme.colors.border,
                          borderBottomWidth:
                            index < category.items.length - 1
                              ? StyleSheet.hairlineWidth
                              : 0,
                        },
                      ]}
                      testID={`checklist-item-${item.id}`}
                    >
                      {/* Item Label + Status Icon */}
                      <View style={styles.itemHeader}>
                        <MaterialCommunityIcons
                          name={getStatusIcon(item.status)}
                          size={20}
                          color={getStatusColor(item.status, theme.colors)}
                        />
                        <Text
                          style={[styles.itemLabel, { color: theme.colors.textPrimary }]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                      </View>

                      {/* Status Buttons */}
                      <View style={styles.statusRow}>
                        {STATUS_OPTIONS.map(opt => {
                          const isSelected = item.status === opt.value;
                          const btnColor = getStatusColor(opt.value, theme.colors);
                          return (
                            <TouchableOpacity
                              key={opt.value}
                              style={[
                                styles.statusButton,
                                {
                                  backgroundColor: isSelected ? btnColor : 'transparent',
                                  borderColor: btnColor,
                                },
                              ]}
                              onPress={() => updateItemStatus(category.id, item.id, opt.value)}
                              activeOpacity={0.7}
                              testID={`checklist-status-${item.id}-${opt.value}`}
                            >
                              <Text
                                style={[
                                  styles.statusButtonText,
                                  { color: isSelected ? '#FFFFFF' : btnColor },
                                ]}
                              >
                                {opt.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Photo */}
                      <View style={styles.photoRow}>
                        {item.photoUri != null ? (
                          <View style={styles.photoContainer}>
                            <Image
                              source={{ uri: item.photoUri }}
                              style={styles.photoThumbnail}
                              testID={`checklist-photo-${item.id}`}
                            />
                            <TouchableOpacity
                              style={[styles.removePhotoButton, { backgroundColor: theme.colors.error }]}
                              onPress={() => removePhoto(category.id, item.id)}
                              testID={`checklist-remove-photo-${item.id}`}
                            >
                              <MaterialCommunityIcons name="close" size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={[styles.addPhotoButton, { borderColor: theme.colors.border }]}
                            onPress={() => handleAddPhoto(category.id, item.id)}
                            activeOpacity={0.7}
                            testID={`checklist-add-photo-${item.id}`}
                          >
                            <MaterialCommunityIcons
                              name="camera-plus"
                              size={20}
                              color={theme.colors.textSecondary}
                            />
                            <Text style={[styles.addPhotoText, { color: theme.colors.textSecondary }]}>
                              Add Photo
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
              </View>
            );
          })}
        </ViewShot>

        {/* Generate Report Button */}
        <View style={styles.reportButtonContainer}>
          <Button
            title="Generate Checklist Report"
            onPress={() => { void handleGenerateReport(); }}
            isLoading={isGenerating}
            disabled={completedCount === 0}
            leftIcon={
              <MaterialCommunityIcons name="file-image" size={20} color="#FFFFFF" />
            }
            testID="generate-report-button"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  addPhotoButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addPhotoText: {
    fontSize: 13,
    fontWeight: '500',
  },
  categoryCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    overflow: 'hidden',
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
    }),
  },
  categoryCount: {
    fontSize: 13,
    fontWeight: '500',
    marginRight: 4,
  },
  categoryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  categoryHeaderLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  categoryHeaderRight: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryWarningIcon: {
    marginRight: 4,
  },
  checklistItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  container: {
    flex: 1,
  },
  issueWarning: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
  issueWarningText: {
    fontSize: 13,
    fontWeight: '500',
  },
  itemHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  itemLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  photoContainer: {
    position: 'relative',
  },
  photoRow: {
    marginTop: 10,
  },
  photoThumbnail: {
    borderRadius: 8,
    height: 80,
    width: 100,
  },
  progressBarBg: {
    borderRadius: 4,
    height: 8,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    borderRadius: 4,
    height: '100%',
  },
  progressCard: {
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    ...Platform.select({
      android: { elevation: 2 },
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
    }),
  },
  progressCount: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  removePhotoButton: {
    alignItems: 'center',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: -6,
    top: -6,
    width: 20,
  },
  reportButtonContainer: {
    marginBottom: 32,
    marginTop: 24,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  statusButton: {
    borderRadius: 6,
    borderWidth: 1.5,
    flex: 1,
    paddingVertical: 6,
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
