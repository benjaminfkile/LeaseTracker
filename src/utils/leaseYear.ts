import type { MileageHistoryEntry } from '../types/api';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Parses an ISO date string (YYYY-MM-DD) as a local date to avoid timezone offset issues.
 */
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(year, month - 1, day);
}

export type ThisYearStats = {
  anniversaryDate: Date;
  nextAnniversaryDate: Date;
  totalDaysThisYear: number;
  daysElapsedThisYear: number;
  daysRemainingThisYear: number;
  totalMilesThisYear: number;
  milesUsedThisYear: number;
  milesRemainingThisYear: number;
  projectedMilesThisYear: number;
  isOverPaceThisYear: boolean;
};

/**
 * Returns the most recent lease-year anniversary on or before today,
 * and the next anniversary (or lease end, whichever is sooner).
 */
export function getLeaseYearWindow(
  startDate: Date,
  endDate: Date,
  today: Date,
): { anniversary: Date; nextAnniversary: Date } {
  let anniversary = new Date(today.getFullYear(), startDate.getMonth(), startDate.getDate());
  if (anniversary > today) {
    anniversary = new Date(today.getFullYear() - 1, startDate.getMonth(), startDate.getDate());
  }
  // If the lease started after the anniversary, use the lease start as the baseline
  if (anniversary < startDate) {
    anniversary = new Date(startDate.getTime());
  }

  let nextAnniversary = new Date(
    anniversary.getFullYear() + 1,
    startDate.getMonth(),
    startDate.getDate(),
  );
  if (nextAnniversary > endDate) {
    nextAnniversary = new Date(endDate.getTime());
  }

  return { anniversary, nextAnniversary };
}

/**
 * Returns the mileage at (or just before) a given date from the history entries.
 * Assumes entries are sorted by date ascending.
 */
export function getMileageAtDate(
  entries: MileageHistoryEntry[],
  date: Date,
): number | undefined {
  const timestamp = date.getTime();
  let result: number | undefined;
  for (const entry of entries) {
    if (parseLocalDate(entry.date).getTime() <= timestamp) {
      result = entry.mileage;
    }
  }
  return result;
}

/**
 * Computes "This Year" pace stats relative to the current lease-year anniversary.
 *
 * If mileageHistory is provided, uses the actual mileage at the anniversary date
 * for a precise milesUsedThisYear value. Otherwise approximates from the overall
 * daily rate (suitable for the Dashboard where history is not loaded).
 */
export function computeThisYearStats(
  lease: { startDate: string; endDate: string; monthlyMiles: number },
  summary: { milesUsed: number; daysRemaining: number; totalMiles: number },
  mileageHistory?: MileageHistoryEntry[],
): ThisYearStats {
  const today = new Date();
  const startDate = parseLocalDate(lease.startDate);
  const endDate = parseLocalDate(lease.endDate);

  const { anniversary, nextAnniversary } = getLeaseYearWindow(startDate, endDate, today);

  const totalDaysThisYear = Math.max(
    1,
    (nextAnniversary.getTime() - anniversary.getTime()) / MS_PER_DAY,
  );
  const daysElapsedThisYear = Math.max(
    0,
    (today.getTime() - anniversary.getTime()) / MS_PER_DAY,
  );
  const daysRemainingThisYear = Math.max(
    0,
    Math.round((nextAnniversary.getTime() - today.getTime()) / MS_PER_DAY),
  );

  // Annual allowance prorated to this lease-year window length
  const totalMilesThisYear = Math.round(lease.monthlyMiles * 12 * (totalDaysThisYear / 365));

  let milesUsedThisYear: number;
  if (mileageHistory != null && mileageHistory.length > 0) {
    const mileageAtAnniversary = getMileageAtDate(mileageHistory, anniversary) ?? 0;
    const latestMileage = mileageHistory[mileageHistory.length - 1].mileage;
    milesUsedThisYear = Math.max(0, latestMileage - mileageAtAnniversary);
  } else {
    // Approximate from the overall daily rate
    const totalDaysLease = Math.max(
      1,
      (endDate.getTime() - startDate.getTime()) / MS_PER_DAY,
    );
    const daysElapsedLease = Math.max(1, totalDaysLease - summary.daysRemaining);
    const dailyRate = summary.milesUsed / daysElapsedLease;
    milesUsedThisYear = Math.round(dailyRate * daysElapsedThisYear);
  }

  const milesRemainingThisYear = Math.max(0, totalMilesThisYear - milesUsedThisYear);
  const projectedMilesThisYear =
    daysElapsedThisYear > 0
      ? Math.round((milesUsedThisYear / daysElapsedThisYear) * totalDaysThisYear)
      : 0;
  const isOverPaceThisYear = projectedMilesThisYear > totalMilesThisYear;

  return {
    anniversaryDate: anniversary,
    nextAnniversaryDate: nextAnniversary,
    totalDaysThisYear: Math.round(totalDaysThisYear),
    daysElapsedThisYear: Math.round(daysElapsedThisYear),
    daysRemainingThisYear,
    totalMilesThisYear,
    milesUsedThisYear,
    milesRemainingThisYear,
    projectedMilesThisYear,
    isOverPaceThisYear,
  };
}

/**
 * Computes how many days ahead or behind pace the user is within a lease-year window.
 */
export function computeThisYearForwardBehind(
  thisYearStats: ThisYearStats,
): { days: number; isAhead: boolean } {
  const { totalDaysThisYear, daysElapsedThisYear, totalMilesThisYear, milesUsedThisYear } =
    thisYearStats;
  const expectedMiles = (daysElapsedThisYear / totalDaysThisYear) * totalMilesThisYear;
  const mileDiff = milesUsedThisYear - expectedMiles;
  const dailyRate = totalMilesThisYear / Math.max(1, totalDaysThisYear);
  const days = Math.round(Math.abs(mileDiff) / Math.max(1, dailyRate));
  return { days, isAhead: mileDiff >= 0 };
}
