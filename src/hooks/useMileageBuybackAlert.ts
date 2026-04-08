import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { useQueryClient } from '@tanstack/react-query';
import { getLeaseSummary } from '../api/leaseApi';
import { getAlertConfig } from '../api/alertsApi';
import { useLeasesStore } from '../stores/leasesStore';
import type { LeaseSummary, AlertConfig } from '../types/api';

const STORAGE_KEY_PREFIX = '@mileage_buyback_alert_sent_';
const DEFAULT_OVERAGE_COST_PER_MILE = 0.25;
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

function computeProjectedOverageCost(summary: LeaseSummary): number {
  const overageMiles = Math.max(0, summary.projectedMiles - summary.totalMiles);
  return overageMiles * DEFAULT_OVERAGE_COST_PER_MILE;
}

function buildNotificationBody(cost: number): string {
  return `You're on track to owe ~$${Math.round(cost)} at turn-in. Consider buying miles now.`;
}

/**
 * Returns a date-based storage key so the alert fires at most once per day per lease.
 */
function getDailyStorageKey(leaseId: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${STORAGE_KEY_PREFIX}${leaseId}_${today}`;
}

async function wasAlertSentToday(leaseId: string): Promise<boolean> {
  const key = getDailyStorageKey(leaseId);
  const value = await AsyncStorage.getItem(key);
  return value === 'true';
}

async function markAlertSentToday(leaseId: string): Promise<void> {
  const key = getDailyStorageKey(leaseId);
  await AsyncStorage.setItem(key, 'true');
}

async function checkAndNotify(leaseId: string): Promise<void> {
  let config: AlertConfig;
  let summary: LeaseSummary;

  try {
    [config, summary] = await Promise.all([
      getAlertConfig(leaseId),
      getLeaseSummary(leaseId),
    ]);
  } catch {
    // Network or auth failure — skip silently
    return;
  }

  if (!config.mileageBuybackEnabled || !config.notifyPush) {
    return;
  }

  const overageCost = computeProjectedOverageCost(summary);
  if (overageCost < config.mileageBuybackThresholdDollars) {
    return;
  }

  const alreadySent = await wasAlertSentToday(leaseId);
  if (alreadySent) {
    return;
  }

  const channelId = await notifee.createChannel({
    id: 'mileage-buyback',
    name: 'Mileage Buy-Back Alerts',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title: 'Mileage Buy-Back Alert',
    body: buildNotificationBody(overageCost),
    data: { leaseId, screen: 'BuybackAnalysis' },
    android: { channelId },
  });

  await markAlertSentToday(leaseId);
}

export function useMileageBuybackAlert(): void {
  const leases = useLeasesStore(state => state.leases);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (leases.length === 0) {
      return;
    }

    // Run once on mount / lease change
    const runChecks = () => {
      for (const lease of leases) {
        checkAndNotify(lease.id).catch(() => {
          // Swallow per-lease errors so others still run
        });
      }
    };

    runChecks();

    // Re-check periodically while the app is foregrounded
    intervalRef.current = setInterval(runChecks, CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [leases]);
}

export { computeProjectedOverageCost, buildNotificationBody };
