jest.mock('@react-native-firebase/messaging', () => {
  const onMessage = jest.fn().mockReturnValue(jest.fn());
  return {
    __esModule: true,
    default: jest.fn(() => ({ onMessage })),
  };
});

jest.mock('@notifee/react-native', () => ({
  __esModule: true,
  default: {
    createChannel: jest.fn().mockResolvedValue('default'),
    displayNotification: jest.fn().mockResolvedValue(undefined),
    onForegroundEvent: jest.fn().mockReturnValue(jest.fn()),
  },
  AndroidImportance: { HIGH: 4 },
  EventType: { PRESS: 1, DISMISSED: 0, DELIVERED: 3, ACTION_PRESS: 2 },
}));

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
import notifee, { EventType } from '@notifee/react-native';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../src/navigation/navigationRef';
import { useForegroundNotification } from '../src/hooks/useForegroundNotification';

const mockMessaging = messaging as jest.Mock;
const mockNotifee = notifee as jest.Mocked<typeof notifee>;
const mockNavigationRef = navigationRef as jest.Mocked<typeof navigationRef>;
const mockCommonActionsNavigate = CommonActions.navigate as jest.Mock;

function TestHookComponent() {
  useForegroundNotification();
  return <View />;
}

describe('useForegroundNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMessaging.mockReturnValue({
      onMessage: jest.fn().mockReturnValue(jest.fn()),
    });
    (mockNotifee.createChannel as jest.Mock).mockResolvedValue('default');
    (mockNotifee.displayNotification as jest.Mock).mockResolvedValue(undefined);
    (mockNotifee.onForegroundEvent as jest.Mock).mockReturnValue(jest.fn());
    (mockNavigationRef.isReady as jest.Mock).mockReturnValue(true);
    (mockNavigationRef.dispatch as jest.Mock).mockReturnValue(undefined);
    mockCommonActionsNavigate.mockImplementation((args: object) => args);
  });

  describe('Firebase message listener', () => {
    it('registers onMessage listener on mount', async () => {
      const mockInstance = {
        onMessage: jest.fn().mockReturnValue(jest.fn()),
      };
      mockMessaging.mockReturnValue(mockInstance);

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent />);
      });

      expect(mockInstance.onMessage).toHaveBeenCalled();
    });

    it('creates the Android channel once on mount (not per-message)', async () => {
      const mockInstance = {
        onMessage: jest.fn().mockReturnValue(jest.fn()),
      };
      mockMessaging.mockReturnValue(mockInstance);

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent />);
      });

      expect(mockNotifee.createChannel).toHaveBeenCalledTimes(1);
      expect(mockNotifee.createChannel).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'default', name: 'Default Channel' }),
      );
    });

    it('calls notifee.displayNotification with title, body, and leaseId from message', async () => {
      let capturedCallback: ((msg: object) => Promise<void>) | undefined;
      const mockInstance = {
        onMessage: jest.fn().mockImplementation((cb: (msg: object) => Promise<void>) => {
          capturedCallback = cb;
          return jest.fn();
        }),
      };
      mockMessaging.mockReturnValue(mockInstance);

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent />);
      });

      await ReactTestRenderer.act(async () => {
        await capturedCallback!({
          notification: { title: 'Mileage Alert', body: 'You are over pace.' },
          data: { leaseId: 'lease-abc' },
        });
      });

      expect(mockNotifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Mileage Alert',
          body: 'You are over pace.',
          data: { leaseId: 'lease-abc' },
        }),
      );
    });

    it('falls back to "LeaseTracker" title when notification.title is absent', async () => {
      let capturedCallback: ((msg: object) => Promise<void>) | undefined;
      const mockInstance = {
        onMessage: jest.fn().mockImplementation((cb: (msg: object) => Promise<void>) => {
          capturedCallback = cb;
          return jest.fn();
        }),
      };
      mockMessaging.mockReturnValue(mockInstance);

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent />);
      });

      await ReactTestRenderer.act(async () => {
        await capturedCallback!({
          notification: {},
          data: { leaseId: 'lease-xyz' },
        });
      });

      expect(mockNotifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'LeaseTracker' }),
      );
    });

    it('stores empty string for leaseId when data.leaseId is absent', async () => {
      let capturedCallback: ((msg: object) => Promise<void>) | undefined;
      const mockInstance = {
        onMessage: jest.fn().mockImplementation((cb: (msg: object) => Promise<void>) => {
          capturedCallback = cb;
          return jest.fn();
        }),
      };
      mockMessaging.mockReturnValue(mockInstance);

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent />);
      });

      await ReactTestRenderer.act(async () => {
        await capturedCallback!({ notification: { title: 'Hi', body: '' }, data: {} });
      });

      expect(mockNotifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({ data: { leaseId: '' } }),
      );
    });

    it('passes the channelId returned by createChannel to displayNotification', async () => {
      (mockNotifee.createChannel as jest.Mock).mockResolvedValue('channel-99');
      let capturedCallback: ((msg: object) => Promise<void>) | undefined;
      const mockInstance = {
        onMessage: jest.fn().mockImplementation((cb: (msg: object) => Promise<void>) => {
          capturedCallback = cb;
          return jest.fn();
        }),
      };
      mockMessaging.mockReturnValue(mockInstance);

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent />);
      });

      await ReactTestRenderer.act(async () => {
        await capturedCallback!({
          notification: { title: 'T', body: 'B' },
          data: { leaseId: 'l1' },
        });
      });

      expect(mockNotifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({ android: { channelId: 'channel-99' } }),
      );
    });
  });

  describe('Notifee foreground event listener', () => {
    it('registers onForegroundEvent listener on mount', async () => {
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent />);
      });

      expect(mockNotifee.onForegroundEvent).toHaveBeenCalled();
    });

    it('dispatches navigation to LeaseDetail when PRESS event fires with a leaseId', async () => {
      let capturedObserver: ((event: object) => void) | undefined;
      (mockNotifee.onForegroundEvent as jest.Mock).mockImplementation(
        (observer: (event: object) => void) => {
          capturedObserver = observer;
          return jest.fn();
        },
      );

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent />);
      });

      await ReactTestRenderer.act(async () => {
        capturedObserver!({
          type: EventType.PRESS,
          detail: { notification: { data: { leaseId: 'lease-42' } } },
        });
      });

      expect(mockCommonActionsNavigate).toHaveBeenCalledWith({
        name: 'LeaseDetail',
        params: { leaseId: 'lease-42' },
      });
      expect(mockNavigationRef.dispatch).toHaveBeenCalled();
    });

    it('does not navigate when PRESS event fires without a leaseId', async () => {
      let capturedObserver: ((event: object) => void) | undefined;
      (mockNotifee.onForegroundEvent as jest.Mock).mockImplementation(
        (observer: (event: object) => void) => {
          capturedObserver = observer;
          return jest.fn();
        },
      );

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent />);
      });

      await ReactTestRenderer.act(async () => {
        capturedObserver!({
          type: EventType.PRESS,
          detail: { notification: { data: {} } },
        });
      });

      expect(mockNavigationRef.dispatch).not.toHaveBeenCalled();
    });

    it('does not navigate when navigationRef is not ready', async () => {
      (mockNavigationRef.isReady as jest.Mock).mockReturnValue(false);
      let capturedObserver: ((event: object) => void) | undefined;
      (mockNotifee.onForegroundEvent as jest.Mock).mockImplementation(
        (observer: (event: object) => void) => {
          capturedObserver = observer;
          return jest.fn();
        },
      );

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent />);
      });

      await ReactTestRenderer.act(async () => {
        capturedObserver!({
          type: EventType.PRESS,
          detail: { notification: { data: { leaseId: 'lease-99' } } },
        });
      });

      expect(mockNavigationRef.dispatch).not.toHaveBeenCalled();
    });

    it('does not navigate for non-PRESS event types', async () => {
      let capturedObserver: ((event: object) => void) | undefined;
      (mockNotifee.onForegroundEvent as jest.Mock).mockImplementation(
        (observer: (event: object) => void) => {
          capturedObserver = observer;
          return jest.fn();
        },
      );

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent />);
      });

      await ReactTestRenderer.act(async () => {
        capturedObserver!({
          type: EventType.DISMISSED,
          detail: { notification: { data: { leaseId: 'lease-1' } } },
        });
      });

      expect(mockNavigationRef.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('cleanup on unmount', () => {
    it('calls the onMessage unsubscribe function when unmounted', async () => {
      const unsubscribeMessage = jest.fn();
      const mockInstance = {
        onMessage: jest.fn().mockReturnValue(unsubscribeMessage),
      };
      mockMessaging.mockReturnValue(mockInstance);

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(<TestHookComponent />);
      });

      await ReactTestRenderer.act(async () => {
        renderer!.unmount();
      });

      expect(unsubscribeMessage).toHaveBeenCalled();
    });

    it('calls the onForegroundEvent unsubscribe function when unmounted', async () => {
      const unsubscribeNotifee = jest.fn();
      (mockNotifee.onForegroundEvent as jest.Mock).mockReturnValue(unsubscribeNotifee);

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(<TestHookComponent />);
      });

      await ReactTestRenderer.act(async () => {
        renderer!.unmount();
      });

      expect(unsubscribeNotifee).toHaveBeenCalled();
    });
  });
});
