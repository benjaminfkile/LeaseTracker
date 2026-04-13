jest.mock('@react-native-firebase/messaging', () => {
  const getInitialNotification = jest.fn().mockResolvedValue(null);
  const onNotificationOpenedApp = jest.fn().mockReturnValue(jest.fn());
  return {
    __esModule: true,
    default: jest.fn(() => ({ getInitialNotification, onNotificationOpenedApp })),
  };
});

jest.mock('@react-navigation/native', () => ({
  CommonActions: {
    navigate: jest.fn((args: object) => args),
  },
}));

jest.mock('../src/navigation/navigationRef', () => ({
  navigationRef: {
    isReady: jest.fn().mockReturnValue(true),
    dispatch: jest.fn(),
  },
}));

import React from 'react';
import { View } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import messaging from '@react-native-firebase/messaging';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../src/navigation/navigationRef';
import { useBackgroundNotification } from '../src/hooks/useBackgroundNotification';

const mockMessaging = messaging as unknown as jest.Mock;
const mockNavigationRef = navigationRef as jest.Mocked<typeof navigationRef>;
const mockCommonActionsNavigate = CommonActions.navigate as jest.Mock;

function TestHookComponent() {
  useBackgroundNotification();
  return <View />;
}

describe('useBackgroundNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockMessaging.mockReturnValue({
      getInitialNotification: jest.fn().mockResolvedValue(null),
      onNotificationOpenedApp: jest.fn().mockReturnValue(jest.fn()),
    });
    (mockNavigationRef.isReady as jest.Mock).mockReturnValue(true);
    (mockNavigationRef.dispatch as jest.Mock).mockReturnValue(undefined);
    mockCommonActionsNavigate.mockImplementation((args: object) => args);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('quit-state notification (getInitialNotification)', () => {
    it('calls getInitialNotification on mount', async () => {
      const mockGetInitialNotification = jest.fn().mockResolvedValue(null);
      mockMessaging.mockReturnValue({
        getInitialNotification: mockGetInitialNotification,
        onNotificationOpenedApp: jest.fn().mockReturnValue(jest.fn()),
      });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent />);
      });

      expect(mockGetInitialNotification).toHaveBeenCalled();
    });

    it('navigates to LeaseDetail when quit-state notification has a leaseId', async () => {
      const mockGetInitialNotification = jest
        .fn()
        .mockResolvedValue({ data: { leaseId: 'lease-quit-1' } });
      mockMessaging.mockReturnValue({
        getInitialNotification: mockGetInitialNotification,
        onNotificationOpenedApp: jest.fn().mockReturnValue(jest.fn()),
      });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent />);
      });

      expect(mockCommonActionsNavigate).toHaveBeenCalledWith({
        name: 'LeaseDetail',
        params: { leaseId: 'lease-quit-1' },
      });
      expect(mockNavigationRef.dispatch).toHaveBeenCalled();
    });

    it('does not navigate when quit-state notification has no leaseId', async () => {
      const mockGetInitialNotification = jest
        .fn()
        .mockResolvedValue({ data: {} });
      mockMessaging.mockReturnValue({
        getInitialNotification: mockGetInitialNotification,
        onNotificationOpenedApp: jest.fn().mockReturnValue(jest.fn()),
      });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent />);
      });

      expect(mockNavigationRef.dispatch).not.toHaveBeenCalled();
    });

    it('does not navigate when getInitialNotification resolves to null', async () => {
      const mockGetInitialNotification = jest.fn().mockResolvedValue(null);
      mockMessaging.mockReturnValue({
        getInitialNotification: mockGetInitialNotification,
        onNotificationOpenedApp: jest.fn().mockReturnValue(jest.fn()),
      });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent />);
      });

      expect(mockNavigationRef.dispatch).not.toHaveBeenCalled();
    });

    it('retries navigation when navigationRef is not ready on first attempt', async () => {
      (mockNavigationRef.isReady as jest.Mock)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      const mockGetInitialNotification = jest
        .fn()
        .mockResolvedValue({ data: { leaseId: 'lease-retry' } });
      mockMessaging.mockReturnValue({
        getInitialNotification: mockGetInitialNotification,
        onNotificationOpenedApp: jest.fn().mockReturnValue(jest.fn()),
      });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent />);
      });

      // Navigation not dispatched yet (isReady returned false)
      expect(mockNavigationRef.dispatch).not.toHaveBeenCalled();

      // Advance timers to trigger the retry
      await ReactTestRenderer.act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(mockCommonActionsNavigate).toHaveBeenCalledWith({
        name: 'LeaseDetail',
        params: { leaseId: 'lease-retry' },
      });
      expect(mockNavigationRef.dispatch).toHaveBeenCalled();
    });
  });

  describe('background-state notification (onNotificationOpenedApp)', () => {
    it('registers onNotificationOpenedApp listener on mount', async () => {
      const mockOnNotificationOpenedApp = jest.fn().mockReturnValue(jest.fn());
      mockMessaging.mockReturnValue({
        getInitialNotification: jest.fn().mockResolvedValue(null),
        onNotificationOpenedApp: mockOnNotificationOpenedApp,
      });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent />);
      });

      expect(mockOnNotificationOpenedApp).toHaveBeenCalled();
    });

    it('navigates to LeaseDetail when background notification has a leaseId', async () => {
      let capturedCallback: ((msg: object) => void) | undefined;
      const mockOnNotificationOpenedApp = jest
        .fn()
        .mockImplementation((cb: (msg: object) => void) => {
          capturedCallback = cb;
          return jest.fn();
        });
      mockMessaging.mockReturnValue({
        getInitialNotification: jest.fn().mockResolvedValue(null),
        onNotificationOpenedApp: mockOnNotificationOpenedApp,
      });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent />);
      });

      await ReactTestRenderer.act(async () => {
        capturedCallback!({ data: { leaseId: 'lease-bg-42' } });
      });

      expect(mockCommonActionsNavigate).toHaveBeenCalledWith({
        name: 'LeaseDetail',
        params: { leaseId: 'lease-bg-42' },
      });
      expect(mockNavigationRef.dispatch).toHaveBeenCalled();
    });

    it('does not navigate when background notification has no leaseId', async () => {
      let capturedCallback: ((msg: object) => void) | undefined;
      const mockOnNotificationOpenedApp = jest
        .fn()
        .mockImplementation((cb: (msg: object) => void) => {
          capturedCallback = cb;
          return jest.fn();
        });
      mockMessaging.mockReturnValue({
        getInitialNotification: jest.fn().mockResolvedValue(null),
        onNotificationOpenedApp: mockOnNotificationOpenedApp,
      });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent />);
      });

      await ReactTestRenderer.act(async () => {
        capturedCallback!({ data: {} });
      });

      expect(mockNavigationRef.dispatch).not.toHaveBeenCalled();
    });

    it('retries navigation when navigationRef is not ready for background tap', async () => {
      (mockNavigationRef.isReady as jest.Mock)
        .mockReturnValueOnce(false) // first attempt for background tap
        .mockReturnValueOnce(true); // retry attempt
      let capturedCallback: ((msg: object) => void) | undefined;
      const mockOnNotificationOpenedApp = jest
        .fn()
        .mockImplementation((cb: (msg: object) => void) => {
          capturedCallback = cb;
          return jest.fn();
        });
      mockMessaging.mockReturnValue({
        getInitialNotification: jest.fn().mockResolvedValue(null),
        onNotificationOpenedApp: mockOnNotificationOpenedApp,
      });

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent />);
      });

      await ReactTestRenderer.act(async () => {
        capturedCallback!({ data: { leaseId: 'lease-no-nav' } });
      });

      // Not yet dispatched (isReady was false)
      expect(mockNavigationRef.dispatch).not.toHaveBeenCalled();

      // Advance timers to trigger retry
      await ReactTestRenderer.act(async () => {
        jest.advanceTimersByTime(100);
      });

      expect(mockCommonActionsNavigate).toHaveBeenCalledWith({
        name: 'LeaseDetail',
        params: { leaseId: 'lease-no-nav' },
      });
      expect(mockNavigationRef.dispatch).toHaveBeenCalled();
    });
  });

  describe('cleanup on unmount', () => {
    it('calls the onNotificationOpenedApp unsubscribe function when unmounted', async () => {
      const unsubscribe = jest.fn();
      const mockOnNotificationOpenedApp = jest.fn().mockReturnValue(unsubscribe);
      mockMessaging.mockReturnValue({
        getInitialNotification: jest.fn().mockResolvedValue(null),
        onNotificationOpenedApp: mockOnNotificationOpenedApp,
      });

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(<TestHookComponent />);
      });

      await ReactTestRenderer.act(async () => {
        renderer!.unmount();
      });

      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
