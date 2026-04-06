import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../navigation/navigationRef';

const NAVIGATION_RETRY_DELAY_MS = 100;

function navigateToLease(leaseId: string): void {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.navigate({ name: 'LeaseDetail', params: { leaseId } }),
    );
  } else {
    setTimeout(() => navigateToLease(leaseId), NAVIGATION_RETRY_DELAY_MS);
  }
}

export function useBackgroundNotification(): void {
  useEffect(() => {
    // Handle quit-state tap (app was closed when notification arrived)
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        const leaseId = remoteMessage?.data?.leaseId as string | undefined;
        if (leaseId) {
          navigateToLease(leaseId);
        }
      });

    // Handle background-state tap (app was backgrounded when notification arrived)
    const unsubscribe = messaging().onNotificationOpenedApp(remoteMessage => {
      const leaseId = remoteMessage?.data?.leaseId as string | undefined;
      if (leaseId) {
        navigateToLease(leaseId);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);
}
