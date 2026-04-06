import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStatus } from '../api/subscriptionApi';

export function useSubscription() {
  const queryClient = useQueryClient();
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const { data, isLoading } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: getStatus,
  });

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (
          (appState.current === 'background' || appState.current === 'inactive') &&
          nextState === 'active'
        ) {
          void queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
        }
        appState.current = nextState;
      },
    );

    return () => subscription.remove();
  }, [queryClient]);

  return {
    isPremium: data?.isPremium ?? false,
    expiresAt: data?.expiresAt ?? null,
    isLoading,
  };
}
