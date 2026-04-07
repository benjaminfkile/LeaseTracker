import { NativeModules, Platform } from 'react-native';

const { WidgetDataBridge: _NativeModule } = NativeModules;

export type PaceStatus = 'on-track' | 'slightly-over' | 'over-pace';

export interface WidgetSummary {
  milesRemaining: number;
  daysRemaining: number;
  paceStatus: PaceStatus;
  vehicleLabel: string;
}

/**
 * Writes lease summary data to the shared App Group UserDefaults so the
 * iOS WidgetKit extension can display up-to-date mileage info without any
 * additional network call.
 *
 * No-op on Android or when the native module is unavailable.
 */
export function updateWidgetData(data: WidgetSummary): void {
  if (Platform.OS !== 'ios' || _NativeModule == null) return;
  _NativeModule.updateWidgetData(
    data.milesRemaining,
    data.daysRemaining,
    data.paceStatus,
    data.vehicleLabel,
  );
}
