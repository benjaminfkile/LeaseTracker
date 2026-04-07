import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import type { WidgetSummary } from '../native/WidgetDataBridge';
import { LeaseTrackerWidgetUI } from './LeaseTrackerWidgetUI';

export const WIDGET_DATA_KEY = '@lease_tracker_widget_data';

const PLACEHOLDER_DATA: WidgetSummary = {
  milesRemaining: 8000,
  daysRemaining: 180,
  paceStatus: 'on-track',
  vehicleLabel: 'My Lease',
};

async function loadWidgetData(): Promise<WidgetSummary> {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    if (raw != null) {
      return JSON.parse(raw) as WidgetSummary;
    }
  } catch {
    // Fall through to placeholder
  }
  return PLACEHOLDER_DATA;
}

/**
 * Headless task handler for the Android home-screen widget.
 *
 * Called by react-native-android-widget when the system requests a widget
 * update (WIDGET_ADDED, periodic WIDGET_UPDATE, WIDGET_RESIZED) or when
 * the app calls requestWidgetUpdate().
 *
 * The widget tap uses clickAction="OPEN_APP" so no special WIDGET_CLICK
 * handling is needed — the library opens the app automatically.
 */
export async function widgetTaskHandler(
  props: WidgetTaskHandlerProps,
): Promise<void> {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const data = await loadWidgetData();
      props.renderWidget(React.createElement(LeaseTrackerWidgetUI, { data }));
      break;
    }
    default:
      break;
  }
}
