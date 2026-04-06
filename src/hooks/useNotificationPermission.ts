import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { savePushToken } from '../api/userApi';

export const NOTIFICATION_PERMISSION_KEY = '@notification_permission';

export type NotificationPermissionStatus = 'granted' | 'denied';

async function syncToken(): Promise<void> {
  try {
    const token = await messaging().getToken();
    await savePushToken(token);
  } catch (error) {
    console.warn('[useNotificationPermission] Failed to sync push token:', error);
  }
}

export function useNotificationPermission() {
  const [shouldShowModal, setShouldShowModal] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY)
      .then(value => {
        if (value === null) {
          setShouldShowModal(true);
        } else if (value === 'granted') {
          syncToken();
        }
      })
      .catch(error => {
        console.warn('[useNotificationPermission] Failed to read storage:', error);
        setShouldShowModal(true);
      });
  }, []);

  useEffect(() => {
    const unsubscribe = messaging().onTokenRefresh(token => {
      savePushToken(token).catch(error => {
        console.warn('[useNotificationPermission] Failed to save refreshed push token:', error);
      });
    });
    return unsubscribe;
  }, []);

  const handlePermission = async (allow: boolean): Promise<void> => {
    setShouldShowModal(false);
    if (allow) {
      try {
        await messaging().requestPermission();
        await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
        await syncToken();
      } catch (error) {
        console.warn('[useNotificationPermission] requestPermission failed:', error);
        await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'denied');
      }
    } else {
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'denied');
    }
  };

  return { shouldShowModal, handlePermission };
}
