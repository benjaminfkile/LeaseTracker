import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';

export const NOTIFICATION_PERMISSION_KEY = '@notification_permission';

export type NotificationPermissionStatus = 'granted' | 'denied';

export function useNotificationPermission() {
  const [shouldShowModal, setShouldShowModal] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY)
      .then(value => {
        if (value === null) {
          setShouldShowModal(true);
        }
      })
      .catch(() => {
        setShouldShowModal(true);
      });
  }, []);

  const handlePermission = async (allow: boolean): Promise<void> => {
    setShouldShowModal(false);
    if (allow) {
      try {
        await messaging().requestPermission();
        await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
      } catch {
        await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'denied');
      }
    } else {
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'denied');
    }
  };

  return { shouldShowModal, handlePermission };
}
