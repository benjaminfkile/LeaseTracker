import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { WIDGET_DATA_KEY, widgetTaskHandler } from '../src/widget/widgetTaskHandler';
import type { WidgetSummary } from '../src/native/WidgetDataBridge';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('../src/widget/LeaseTrackerWidgetUI', () => ({
  LeaseTrackerWidgetUI: 'LeaseTrackerWidgetUI',
}));

const mockRenderWidget = jest.fn();

const mockData: WidgetSummary = {
  milesRemaining: 12000,
  daysRemaining: 200,
  paceStatus: 'on-track',
  vehicleLabel: '2023 Toyota Camry SE',
};

describe('widgetTaskHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders widget with data from AsyncStorage on WIDGET_ADDED', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));
    await widgetTaskHandler({
      widgetAction: 'WIDGET_ADDED',
      widgetInfo: { widgetId: 1, widgetName: 'LeaseTracker', width: 180, height: 110, screenInfo: { screenHeightDp: 800, screenWidthDp: 400, density: 2, densityDpi: 320 } },
      renderWidget: mockRenderWidget,
    });
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(WIDGET_DATA_KEY);
    expect(mockRenderWidget).toHaveBeenCalledTimes(1);
    const element = mockRenderWidget.mock.calls[0][0];
    expect(element.props.data).toEqual(mockData);
  });

  it('renders widget with data from AsyncStorage on WIDGET_UPDATE', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));
    await widgetTaskHandler({
      widgetAction: 'WIDGET_UPDATE',
      widgetInfo: { widgetId: 1, widgetName: 'LeaseTracker', width: 180, height: 110, screenInfo: { screenHeightDp: 800, screenWidthDp: 400, density: 2, densityDpi: 320 } },
      renderWidget: mockRenderWidget,
    });
    expect(mockRenderWidget).toHaveBeenCalledTimes(1);
  });

  it('renders widget with data from AsyncStorage on WIDGET_RESIZED', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));
    await widgetTaskHandler({
      widgetAction: 'WIDGET_RESIZED',
      widgetInfo: { widgetId: 1, widgetName: 'LeaseTracker', width: 360, height: 220, screenInfo: { screenHeightDp: 800, screenWidthDp: 400, density: 2, densityDpi: 320 } },
      renderWidget: mockRenderWidget,
    });
    expect(mockRenderWidget).toHaveBeenCalledTimes(1);
  });

  it('falls back to placeholder data when AsyncStorage returns null', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    await widgetTaskHandler({
      widgetAction: 'WIDGET_ADDED',
      widgetInfo: { widgetId: 1, widgetName: 'LeaseTracker', width: 180, height: 110, screenInfo: { screenHeightDp: 800, screenWidthDp: 400, density: 2, densityDpi: 320 } },
      renderWidget: mockRenderWidget,
    });
    expect(mockRenderWidget).toHaveBeenCalledTimes(1);
    const element = mockRenderWidget.mock.calls[0][0];
    expect(element.props.data.paceStatus).toBe('on-track');
    expect(element.props.data.vehicleLabel).toBe('My Lease');
  });

  it('falls back to placeholder data when AsyncStorage throws', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('storage error'));
    await widgetTaskHandler({
      widgetAction: 'WIDGET_ADDED',
      widgetInfo: { widgetId: 1, widgetName: 'LeaseTracker', width: 180, height: 110, screenInfo: { screenHeightDp: 800, screenWidthDp: 400, density: 2, densityDpi: 320 } },
      renderWidget: mockRenderWidget,
    });
    expect(mockRenderWidget).toHaveBeenCalledTimes(1);
    const element = mockRenderWidget.mock.calls[0][0];
    expect(element.props.data.vehicleLabel).toBe('My Lease');
  });

  it('does not call renderWidget for unrecognised actions', async () => {
    await widgetTaskHandler({
      widgetAction: 'WIDGET_DELETED' as never,
      widgetInfo: { widgetId: 1, widgetName: 'LeaseTracker', width: 180, height: 110, screenInfo: { screenHeightDp: 800, screenWidthDp: 400, density: 2, densityDpi: 320 } },
      renderWidget: mockRenderWidget,
    });
    expect(mockRenderWidget).not.toHaveBeenCalled();
  });

  it('passes the correct element type to renderWidget', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockData));
    await widgetTaskHandler({
      widgetAction: 'WIDGET_ADDED',
      widgetInfo: { widgetId: 1, widgetName: 'LeaseTracker', width: 180, height: 110, screenInfo: { screenHeightDp: 800, screenWidthDp: 400, density: 2, densityDpi: 320 } },
      renderWidget: mockRenderWidget,
    });
    const element = mockRenderWidget.mock.calls[0][0];
    expect(React.isValidElement(element)).toBe(true);
  });
});
