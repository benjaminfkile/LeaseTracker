import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../navigation/navigationRef';

const NAVIGATION_RETRY_DELAY_MS = 100;

function navigateFromNotification(leaseId: string, screen?: string): void {
  const targetScreen = screen === 'BuybackAnalysis' ? 'BuybackAnalysis' : 'LeaseDetail';
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.navigate({ name: targetScreen, params: { leaseId } }),
    );
  } else {
    setTimeout(() => navigateFromNotification(leaseId, screen), NAVIGATION_RETRY_DELAY_MS);
  }
}

export function useBackgroundNotification(): void {
  useEffect(() => {
    // Handle quit-state tap (app was closed when notification arrived)
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        const leaseId = remoteMessage?.data?.leaseId as string | undefined;
        const screen = remoteMessage?.data?.screen as string | undefined;
        if (leaseId) {
          navigateFromNotification(leaseId, screen);
        }
      });

    // Handle background-state tap (app was backgrounded when notification arrived)
    const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      const leaseId = remoteMessage?.data?.leaseId as string | undefined;
      const screen = remoteMessage?.data?.screen as string | undefined;
      if (leaseId) {
        navigateFromNotification(leaseId, screen);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);
}
