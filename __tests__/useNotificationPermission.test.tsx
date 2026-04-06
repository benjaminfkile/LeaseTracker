jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('@react-native-firebase/messaging', () => {
  const requestPermission = jest.fn().mockResolvedValue(1);
  return {
    __esModule: true,
    default: jest.fn(() => ({ requestPermission })),
  };
});

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import {
  useNotificationPermission,
  NOTIFICATION_PERMISSION_KEY,
} from '../src/hooks/useNotificationPermission';

const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;
const mockMessaging = messaging as jest.Mock;

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
    mockMessaging.mockReturnValue({ requestPermission: jest.fn().mockResolvedValue(1) });
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
      expect(mockMessaging).not.toHaveBeenCalled();
    });
  });
});

