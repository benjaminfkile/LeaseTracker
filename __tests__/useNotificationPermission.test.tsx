jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@react-native-firebase/messaging', () => {
  const requestPermission = jest.fn().mockResolvedValue(1);
  const getToken = jest.fn().mockResolvedValue('test-fcm-token');
  const onTokenRefresh = jest.fn().mockReturnValue(jest.fn());
  return {
    __esModule: true,
    default: jest.fn(() => ({ requestPermission, getToken, onTokenRefresh })),
  };
});

jest.mock('../src/api/userApi', () => ({
  savePushToken: jest.fn().mockResolvedValue(undefined),
}));

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { savePushToken } from '../src/api/userApi';
import {
  useNotificationPermission,
  NOTIFICATION_PERMISSION_KEY,
} from '../src/hooks/useNotificationPermission';

const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;
const mockMessaging = messaging as unknown as jest.Mock;
const mockSavePushToken = savePushToken as jest.Mock;

// Captured ref to hook output so tests can interact with it.
type HookRef = {
  shouldShowModal: boolean;
  handlePermission: (allow: boolean) => Promise<void>;
};

function TestHookComponent({ onRender }: { onRender: (result: HookRef) => void }) {
  const result = useNotificationPermission();
  onRender(result);
  return (
    <View>
      <Text testID="should-show-modal">{String(result.shouldShowModal)}</Text>
    </View>
  );
}

describe('useNotificationPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMessaging.mockReturnValue({
      requestPermission: jest.fn().mockResolvedValue(1),
      getToken: jest.fn().mockResolvedValue('test-fcm-token'),
      onTokenRefresh: jest.fn().mockReturnValue(jest.fn()),
    });
  });

  describe('shouldShowModal', () => {
    it('starts as false and remains false when a stored permission exists', async () => {
      mockGetItem.mockResolvedValue('granted');
      let latest: HookRef | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });
      expect(latest!.shouldShowModal).toBe(false);
    });

    it('becomes true when no stored permission exists', async () => {
      mockGetItem.mockResolvedValue(null);
      let latest: HookRef | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });
      expect(latest!.shouldShowModal).toBe(true);
    });

    it('stays false when permission is already stored as granted', async () => {
      mockGetItem.mockResolvedValue('granted');
      let latest: HookRef | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });
      expect(latest!.shouldShowModal).toBe(false);
    });

    it('stays false when permission is already stored as denied', async () => {
      mockGetItem.mockResolvedValue('denied');
      let latest: HookRef | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });
      expect(latest!.shouldShowModal).toBe(false);
    });

    it('becomes true when AsyncStorage.getItem rejects', async () => {
      mockGetItem.mockRejectedValue(new Error('storage error'));
      let latest: HookRef | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });
      expect(latest!.shouldShowModal).toBe(true);
    });

    it('reads from the correct AsyncStorage key', async () => {
      mockGetItem.mockResolvedValue('granted');
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={() => {}} />);
      });
      expect(mockGetItem).toHaveBeenCalledWith(NOTIFICATION_PERMISSION_KEY);
    });
  });

  describe('handlePermission — allow', () => {
    it('hides the modal when allow is true', async () => {
      mockGetItem.mockResolvedValue(null);
      let latest: HookRef | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });
      expect(latest!.shouldShowModal).toBe(true);

      await ReactTestRenderer.act(async () => {
        await latest!.handlePermission(true);
      });
      expect(latest!.shouldShowModal).toBe(false);
    });

    it('calls messaging().requestPermission() when allow is true', async () => {
      mockGetItem.mockResolvedValue(null);
      let latest: HookRef | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });

      await ReactTestRenderer.act(async () => {
        await latest!.handlePermission(true);
      });
      const instance = mockMessaging.mock.results[mockMessaging.mock.results.length - 1].value;
      expect(instance.requestPermission).toHaveBeenCalled();
    });

    it('stores "granted" in AsyncStorage when requestPermission succeeds', async () => {
      mockGetItem.mockResolvedValue(null);
      let latest: HookRef | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });

      await ReactTestRenderer.act(async () => {
        await latest!.handlePermission(true);
      });
      expect(mockSetItem).toHaveBeenCalledWith(NOTIFICATION_PERMISSION_KEY, 'granted');
    });

    it('stores "denied" in AsyncStorage when requestPermission throws', async () => {
      mockMessaging.mockReturnValue({
        requestPermission: jest.fn().mockRejectedValue(new Error('permission denied')),
        getToken: jest.fn().mockResolvedValue('token'),
        onTokenRefresh: jest.fn().mockReturnValue(jest.fn()),
      });
      mockGetItem.mockResolvedValue(null);
      let latest: HookRef | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });

      await ReactTestRenderer.act(async () => {
        await latest!.handlePermission(true);
      });
      expect(mockSetItem).toHaveBeenCalledWith(NOTIFICATION_PERMISSION_KEY, 'denied');
    });
  });

  describe('handlePermission — deny', () => {
    it('hides the modal when allow is false', async () => {
      mockGetItem.mockResolvedValue(null);
      let latest: HookRef | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });
      expect(latest!.shouldShowModal).toBe(true);

      await ReactTestRenderer.act(async () => {
        await latest!.handlePermission(false);
      });
      expect(latest!.shouldShowModal).toBe(false);
    });

    it('stores "denied" in AsyncStorage when allow is false', async () => {
      mockGetItem.mockResolvedValue(null);
      let latest: HookRef | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });

      await ReactTestRenderer.act(async () => {
        await latest!.handlePermission(false);
      });
      expect(mockSetItem).toHaveBeenCalledWith(NOTIFICATION_PERMISSION_KEY, 'denied');
    });

    it('does not call messaging().requestPermission() when allow is false', async () => {
      mockGetItem.mockResolvedValue(null);
      let latest: HookRef | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });

      await ReactTestRenderer.act(async () => {
        await latest!.handlePermission(false);
      });
      const instance = mockMessaging.mock.results[mockMessaging.mock.results.length - 1].value;
      expect(instance.requestPermission).not.toHaveBeenCalled();
    });
  });

  describe('token registration — on permission grant', () => {
    it('calls messaging().getToken() after successful permission grant', async () => {
      mockGetItem.mockResolvedValue(null);
      let latest: HookRef | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });

      await ReactTestRenderer.act(async () => {
        await latest!.handlePermission(true);
      });
      const instance = mockMessaging.mock.results[mockMessaging.mock.results.length - 1].value;
      expect(instance.getToken).toHaveBeenCalled();
    });

    it('calls savePushToken with the FCM token after successful permission grant', async () => {
      mockGetItem.mockResolvedValue(null);
      const mockInstance = {
        requestPermission: jest.fn().mockResolvedValue(1),
        getToken: jest.fn().mockResolvedValue('fcm-token-xyz'),
        onTokenRefresh: jest.fn().mockReturnValue(jest.fn()),
      };
      mockMessaging.mockReturnValue(mockInstance);
      let latest: HookRef | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });

      await ReactTestRenderer.act(async () => {
        await latest!.handlePermission(true);
      });
      expect(mockSavePushToken).toHaveBeenCalledWith('fcm-token-xyz');
    });

    it('does not call getToken() when requestPermission fails', async () => {
      const mockInstance = {
        requestPermission: jest.fn().mockRejectedValue(new Error('permission denied')),
        getToken: jest.fn().mockResolvedValue('should-not-be-called'),
        onTokenRefresh: jest.fn().mockReturnValue(jest.fn()),
      };
      mockMessaging.mockReturnValue(mockInstance);
      mockGetItem.mockResolvedValue(null);
      let latest: HookRef | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });

      await ReactTestRenderer.act(async () => {
        await latest!.handlePermission(true);
      });
      expect(mockInstance.getToken).not.toHaveBeenCalled();
    });

    it('does not call getToken() when allow is false', async () => {
      mockGetItem.mockResolvedValue(null);
      let latest: HookRef | undefined;
      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={r => { latest = r; }} />);
      });

      await ReactTestRenderer.act(async () => {
        await latest!.handlePermission(false);
      });
      const instance = mockMessaging.mock.results[0].value;
      expect(instance.getToken).not.toHaveBeenCalled();
    });
  });

  describe('token registration — on app launch with existing grant', () => {
    it('calls messaging().getToken() on mount when permission is already granted', async () => {
      mockGetItem.mockResolvedValue('granted');
      const mockInstance = {
        requestPermission: jest.fn().mockResolvedValue(1),
        getToken: jest.fn().mockResolvedValue('launch-token'),
        onTokenRefresh: jest.fn().mockReturnValue(jest.fn()),
      };
      mockMessaging.mockReturnValue(mockInstance);

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={() => {}} />);
      });
      expect(mockInstance.getToken).toHaveBeenCalled();
    });

    it('calls savePushToken with the FCM token on launch when permission is already granted', async () => {
      mockGetItem.mockResolvedValue('granted');
      const mockInstance = {
        requestPermission: jest.fn().mockResolvedValue(1),
        getToken: jest.fn().mockResolvedValue('launch-token'),
        onTokenRefresh: jest.fn().mockReturnValue(jest.fn()),
      };
      mockMessaging.mockReturnValue(mockInstance);

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={() => {}} />);
      });
      expect(mockSavePushToken).toHaveBeenCalledWith('launch-token');
    });

    it('does not call getToken() on mount when permission is denied', async () => {
      mockGetItem.mockResolvedValue('denied');
      const mockInstance = {
        requestPermission: jest.fn().mockResolvedValue(1),
        getToken: jest.fn().mockResolvedValue('should-not-be-called'),
        onTokenRefresh: jest.fn().mockReturnValue(jest.fn()),
      };
      mockMessaging.mockReturnValue(mockInstance);

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={() => {}} />);
      });
      expect(mockInstance.getToken).not.toHaveBeenCalled();
    });

    it('does not call getToken() on mount when no permission stored', async () => {
      mockGetItem.mockResolvedValue(null);
      const mockInstance = {
        requestPermission: jest.fn().mockResolvedValue(1),
        getToken: jest.fn().mockResolvedValue('should-not-be-called'),
        onTokenRefresh: jest.fn().mockReturnValue(jest.fn()),
      };
      mockMessaging.mockReturnValue(mockInstance);

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={() => {}} />);
      });
      expect(mockInstance.getToken).not.toHaveBeenCalled();
    });
  });

  describe('token refresh listener', () => {
    it('registers an onTokenRefresh listener on mount', async () => {
      mockGetItem.mockResolvedValue('granted');
      const mockInstance = {
        requestPermission: jest.fn().mockResolvedValue(1),
        getToken: jest.fn().mockResolvedValue('token'),
        onTokenRefresh: jest.fn().mockReturnValue(jest.fn()),
      };
      mockMessaging.mockReturnValue(mockInstance);

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={() => {}} />);
      });
      expect(mockInstance.onTokenRefresh).toHaveBeenCalled();
    });

    it('calls savePushToken when the token refresh callback fires', async () => {
      mockGetItem.mockResolvedValue('granted');
      let capturedRefreshCallback: ((token: string) => void) | undefined;
      const mockInstance = {
        requestPermission: jest.fn().mockResolvedValue(1),
        getToken: jest.fn().mockResolvedValue('initial-token'),
        onTokenRefresh: jest.fn().mockImplementation((cb: (token: string) => void) => {
          capturedRefreshCallback = cb;
          return jest.fn();
        }),
      };
      mockMessaging.mockReturnValue(mockInstance);

      await ReactTestRenderer.act(async () => {
        ReactTestRenderer.create(<TestHookComponent onRender={() => {}} />);
      });

      mockSavePushToken.mockClear();
      await ReactTestRenderer.act(async () => {
        capturedRefreshCallback!('refreshed-token');
      });
      expect(mockSavePushToken).toHaveBeenCalledWith('refreshed-token');
    });

    it('returns the unsubscribe function from onTokenRefresh as cleanup', async () => {
      mockGetItem.mockResolvedValue(null);
      const unsubscribe = jest.fn();
      const mockInstance = {
        requestPermission: jest.fn().mockResolvedValue(1),
        getToken: jest.fn().mockResolvedValue('token'),
        onTokenRefresh: jest.fn().mockReturnValue(unsubscribe),
      };
      mockMessaging.mockReturnValue(mockInstance);

      let renderer: ReactTestRenderer.ReactTestRenderer;
      await ReactTestRenderer.act(async () => {
        renderer = ReactTestRenderer.create(<TestHookComponent onRender={() => {}} />);
      });

      await ReactTestRenderer.act(async () => {
        renderer!.unmount();
      });
      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});

