import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import { WIDGET_DATA_KEY } from '../widget/widgetTaskHandler';

const { WidgetDataBridge: _NativeModule } = NativeModules;

export type PaceStatus = 'on-track' | 'slightly-over' | 'over-pace';

export interface WidgetSummary {
  milesRemaining: number;
  daysRemaining: number;
  paceStatus: PaceStatus;
  vehicleLabel: string;
}

/**
 * Pushes fresh lease summary data to the platform home-screen widget.
 *
 * iOS  — writes to the shared App Group UserDefaults so the WidgetKit
 *         extension can read it without an extra network call.
 *
 * Android — persists the data in AsyncStorage (so the headless widget task
 *            handler can read it on system-initiated refreshes) and
 *            immediately re-renders every LeaseTracker widget via
 *            react-native-android-widget's requestWidgetUpdate.
 */
export function updateWidgetData(data: WidgetSummary): void {
  if (Platform.OS === 'ios') {
    if (_NativeModule == null) return;
    _NativeModule.updateWidgetData(
      data.milesRemaining,
      data.daysRemaining,
      data.paceStatus,
      data.vehicleLabel,
    );
    return;
  }

  if (Platform.OS === 'android') {
    AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data))
      .then(() => {
        // Dynamic require keeps react-native-android-widget out of the iOS
        // bundle path where RNAndroidWidget native module is unavailable.
        const {
          requestWidgetUpdate,
        } = require('react-native-android-widget') as typeof import('react-native-android-widget');
        const React = require('react') as typeof import('react');
        const {
          LeaseTrackerWidgetUI,
        } = require('../widget/LeaseTrackerWidgetUI') as typeof import('../widget/LeaseTrackerWidgetUI');

        requestWidgetUpdate({
          widgetName: 'LeaseTracker',
          renderWidget: () => React.createElement(LeaseTrackerWidgetUI, { data }),
          widgetNotFound: () => undefined,
        });
      })
      .catch(() => undefined);
  }
}
