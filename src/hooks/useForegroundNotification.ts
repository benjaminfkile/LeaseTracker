import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../navigation/navigationRef';

async function ensureChannel(): Promise<string> {
  return notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });
}

export function useForegroundNotification(): void {
  useEffect(() => {
    const channelPromise = ensureChannel();

    const unsubscribeMessage = messaging().onMessage(async remoteMessage => {
      const channelId = await channelPromise;
      const leaseId = remoteMessage.data?.leaseId as string | undefined;

      await notifee.displayNotification({
        title: remoteMessage.notification?.title ?? 'LeaseTracker',
        body: remoteMessage.notification?.body ?? '',
        data: { leaseId: leaseId ?? '' },
        android: { channelId },
      });
    });

    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS) {
        const leaseId = detail.notification?.data?.leaseId as string | undefined;
        const screen = detail.notification?.data?.screen as string | undefined;
        if (leaseId && navigationRef.isReady()) {
          const targetScreen = screen === 'BuybackAnalysis' ? 'BuybackAnalysis' : 'LeaseDetail';
          navigationRef.dispatch(
            CommonActions.navigate({ name: targetScreen, params: { leaseId } }),
          );
        }
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeNotifee();
    };
  }, []);
}
