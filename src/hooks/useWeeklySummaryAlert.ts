import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { getLeaseSummary, getMileageHistory } from '../api/leaseApi';
import { getAlertConfigs } from '../api/alertsApi';
import { useLeasesStore } from '../stores/leasesStore';
import type { LeaseSummary, MileageHistoryEntry, AlertConfig } from '../types/api';

const STORAGE_KEY_PREFIX = '@weekly_summary_alert_sent_';
const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Returns an ISO-week-based storage key so the alert fires at most once per week per lease.
 */
function getWeeklyStorageKey(leaseId: string): string {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
  const weekNumber = Math.ceil((dayOfYear + yearStart.getDay() + 1) / 7);
  return `${STORAGE_KEY_PREFIX}${leaseId}_${now.getFullYear()}_w${weekNumber}`;
}

async function wasAlertSentThisWeek(leaseId: string): Promise<boolean> {
  const key = getWeeklyStorageKey(leaseId);
  const value = await AsyncStorage.getItem(key);
  return value === 'true';
}

async function markAlertSentThisWeek(leaseId: string): Promise<void> {
  const key = getWeeklyStorageKey(leaseId);
  await AsyncStorage.setItem(key, 'true');
}

/**
 * Computes the miles driven during the previous 7-day window using mileage history entries.
 * Returns 0 if insufficient data.
 */
function computeLastWeekMiles(entries: MileageHistoryEntry[]): number {
  if (entries.length === 0) {
    return 0;
  }

  const now = new Date();
  const endOfLastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Go back to the most recent Monday (start of current week), then back 7 days
  const daysSinceMonday = (now.getDay() + 6) % 7;
  const startOfThisWeek = new Date(endOfLastWeek);
  startOfThisWeek.setDate(startOfThisWeek.getDate() - daysSinceMonday);

  const startOfLastWeek = new Date(startOfThisWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const startTs = startOfLastWeek.getTime();
  const endTs = startOfThisWeek.getTime();

  let mileageAtStart: number | undefined;
  let mileageAtEnd: number | undefined;

  for (const entry of entries) {
    const entryDate = parseLocalDate(entry.month);
    const entryTs = entryDate.getTime();
    if (entryTs <= startTs) {
      mileageAtStart = entry.miles_driven;
    }
    if (entryTs <= endTs) {
      mileageAtEnd = entry.miles_driven;
    }
  }

  if (mileageAtStart == null || mileageAtEnd == null) {
    return 0;
  }

  return Math.max(0, mileageAtEnd - mileageAtStart);
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Computes how many miles ahead or behind pace the user is based on LeaseSummary.
 * Positive = ahead (under pace, good). Negative = behind (over pace, bad).
 */
function computePaceDiffMiles(
  summary: LeaseSummary,
  lease: { lease_start_date: string; lease_end_date: string; total_miles_allowed: number },
): number {
  const startDate = parseLocalDate(lease.lease_start_date);
  const endDate = parseLocalDate(lease.lease_end_date);
  const totalDays = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.max(0, totalDays - summary.days_remaining);
  const expectedMiles = lease.total_miles_allowed * (daysElapsed / totalDays);
  return Math.round(expectedMiles - summary.miles_driven);
}

function buildNotificationBody(
  weekMiles: number,
  paceDiff: number,
): string {
  const paceAbs = Math.abs(paceDiff);
  if (paceDiff >= 0) {
    return `Last week: ${weekMiles} miles. You're ${paceAbs} miles ahead of pace. Keep it up! \u{1F7E2}`;
  }
  return `Last week: ${weekMiles} miles. You're ${paceAbs} miles behind pace. Time to ease off! \u{1F534}`;
}

function isMonday(): boolean {
  return new Date().getDay() === 1;
}

async function checkAndNotify(
  leaseId: string,
  leaseStartDate: string,
  leaseEndDate: string,
  totalMilesAllowed: number,
): Promise<void> {
  if (!isMonday()) {
    return;
  }

  let configs: AlertConfig[];
  let summary: LeaseSummary;
  let historyEntries: MileageHistoryEntry[];

  try {
    const [configsResult, summaryResult, historyResult] = await Promise.all([
      getAlertConfigs(leaseId),
      getLeaseSummary(leaseId),
      getMileageHistory(leaseId),
    ]);
    configs = configsResult;
    summary = summaryResult;
    historyEntries = historyResult;
  } catch {
    return;
  }

  const config = configs.find(c => c.alert_type === 'days_remaining');
  if (config == null || !config.is_enabled) {
    return;
  }

  const alreadySent = await wasAlertSentThisWeek(leaseId);
  if (alreadySent) {
    return;
  }

  const weekMiles = computeLastWeekMiles(historyEntries);
  const paceDiff = computePaceDiffMiles(summary, {
    lease_start_date: leaseStartDate,
    lease_end_date: leaseEndDate,
    total_miles_allowed: totalMilesAllowed,
  });

  const channelId = await notifee.createChannel({
    id: 'weekly-summary',
    name: 'Weekly Summary',
    importance: AndroidImportance.HIGH,
  });

  await notifee.displayNotification({
    title: 'Weekly Mileage Summary',
    body: buildNotificationBody(weekMiles, paceDiff),
    data: { leaseId, screen: 'LeaseDetail' },
    android: { channelId },
  });

  await markAlertSentThisWeek(leaseId);
}

export function useWeeklySummaryAlert(): void {
  const leases = useLeasesStore(state => state.leases);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (leases.length === 0) {
      return;
    }

    const runChecks = () => {
      for (const lease of leases) {
        checkAndNotify(lease.id, lease.lease_start_date, lease.lease_end_date, lease.total_miles_allowed).catch(() => {
          // Swallow per-lease errors so others still run
        });
      }
    };

    runChecks();

    intervalRef.current = setInterval(runChecks, CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current != null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [leases]);
}

export { computeLastWeekMiles, computePaceDiffMiles, buildNotificationBody, isMonday };
