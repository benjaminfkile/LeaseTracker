import {
  getLeaseYearWindow,
  getMileageAtDate,
  computeThisYearStats,
  computeThisYearForwardBehind,
} from '../src/utils/leaseYear';
import type { ThisYearStats } from '../src/utils/leaseYear';

// Helper to create a local Date without timezone offset issues
function localDate(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

describe('getLeaseYearWindow', () => {
  it('returns the anniversary in the prior year when this year has not passed yet', () => {
    const startDate = localDate(2023, 6, 1); // June 1
    const endDate = localDate(2028, 6, 1);
    const today = localDate(2026, 3, 1); // March 1 — before June 1 anniversary
    const { anniversary, nextAnniversary } = getLeaseYearWindow(startDate, endDate, today);
    expect(anniversary.getFullYear()).toBe(2025);
    expect(anniversary.getMonth()).toBe(5); // June (0-indexed)
    expect(anniversary.getDate()).toBe(1);
    expect(nextAnniversary.getFullYear()).toBe(2026);
    expect(nextAnniversary.getMonth()).toBe(5);
    expect(nextAnniversary.getDate()).toBe(1);
  });

  it('returns the anniversary in the current year when it has already passed', () => {
    const startDate = localDate(2023, 1, 15); // Jan 15
    const endDate = localDate(2028, 1, 15);
    const today = localDate(2026, 4, 7); // April 7 — after Jan 15
    const { anniversary } = getLeaseYearWindow(startDate, endDate, today);
    expect(anniversary.getFullYear()).toBe(2026);
    expect(anniversary.getMonth()).toBe(0); // January
    expect(anniversary.getDate()).toBe(15);
  });

  it('caps anniversary at startDate when lease started this year', () => {
    const startDate = localDate(2026, 2, 1); // Feb 1 2026
    const endDate = localDate(2029, 2, 1);
    const today = localDate(2026, 4, 7);
    const { anniversary } = getLeaseYearWindow(startDate, endDate, today);
    expect(anniversary.getTime()).toBe(startDate.getTime());
  });

  it('caps nextAnniversary at endDate when next anniversary is after lease end', () => {
    const startDate = localDate(2023, 1, 1);
    const endDate = localDate(2026, 6, 1); // ends June 1 2026 — before Jan 1 2027
    const today = localDate(2026, 4, 7);
    const { nextAnniversary } = getLeaseYearWindow(startDate, endDate, today);
    expect(nextAnniversary.getTime()).toBe(endDate.getTime());
  });
});

describe('getMileageAtDate', () => {
  const entries = [
    { date: '2024-01-01', mileage: 1000, projectedMileage: 1000 },
    { date: '2024-03-01', mileage: 3000, projectedMileage: 3000 },
    { date: '2024-06-01', mileage: 6000, projectedMileage: 6000 },
  ];

  it('returns the mileage of the last entry on or before the given date', () => {
    const result = getMileageAtDate(entries, localDate(2024, 4, 1));
    expect(result).toBe(3000);
  });

  it('returns the exact entry mileage when date matches', () => {
    const result = getMileageAtDate(entries, localDate(2024, 3, 1));
    expect(result).toBe(3000);
  });

  it('returns the last entry if date is after all entries', () => {
    const result = getMileageAtDate(entries, localDate(2025, 1, 1));
    expect(result).toBe(6000);
  });

  it('returns undefined when all entries are after the given date', () => {
    const result = getMileageAtDate(entries, localDate(2023, 12, 1));
    expect(result).toBeUndefined();
  });

  it('returns undefined for an empty array', () => {
    const result = getMileageAtDate([], localDate(2024, 1, 1));
    expect(result).toBeUndefined();
  });
});

describe('computeThisYearStats', () => {
  // Active lease: 2023-01-01 to 2028-01-01 (today is 2026-04-07 per system date)
  // Anniversary: Jan 1 2026 (already passed this year)
  // Next anniversary: Jan 1 2027
  const lease = {
    startDate: '2023-01-01',
    endDate: '2028-01-01',
    monthlyMiles: 1000,
  };
  const summary = {
    milesUsed: 36000,
    daysRemaining: 365,
    totalMiles: 60000,
  };

  it('returns a ThisYearStats object with expected shape', () => {
    const result = computeThisYearStats(lease, summary);
    expect(result).toHaveProperty('anniversaryDate');
    expect(result).toHaveProperty('nextAnniversaryDate');
    expect(result).toHaveProperty('totalDaysThisYear');
    expect(result).toHaveProperty('daysElapsedThisYear');
    expect(result).toHaveProperty('daysRemainingThisYear');
    expect(result).toHaveProperty('totalMilesThisYear');
    expect(result).toHaveProperty('milesUsedThisYear');
    expect(result).toHaveProperty('milesRemainingThisYear');
    expect(result).toHaveProperty('projectedMilesThisYear');
    expect(result).toHaveProperty('isOverPaceThisYear');
  });

  it('milesRemainingThisYear is non-negative', () => {
    const result = computeThisYearStats(lease, summary);
    expect(result.milesRemainingThisYear).toBeGreaterThanOrEqual(0);
  });

  it('daysRemainingThisYear is non-negative', () => {
    const result = computeThisYearStats(lease, summary);
    expect(result.daysRemainingThisYear).toBeGreaterThanOrEqual(0);
  });

  it('totalMilesThisYear is approximately monthlyMiles * 12', () => {
    const result = computeThisYearStats(lease, summary);
    // Full Jan-Jan year window → should be close to 12000
    expect(result.totalMilesThisYear).toBeGreaterThan(11000);
    expect(result.totalMilesThisYear).toBeLessThan(13000);
  });

  it('uses mileage history to compute milesUsedThisYear when provided', () => {
    // anniversary = Jan 1 2026, nextAnniversary = Jan 1 2027
    const entries = [
      { date: '2023-01-01', mileage: 0, projectedMileage: 0 },
      { date: '2024-01-01', mileage: 12000, projectedMileage: 12000 },
      { date: '2025-01-01', mileage: 24000, projectedMileage: 24000 },
      { date: '2026-01-01', mileage: 36000, projectedMileage: 36000 }, // anniversary
      { date: '2026-04-01', mileage: 39000, projectedMileage: 39000 }, // latest
    ];
    const result = computeThisYearStats(lease, summary, entries);
    // milesAtAnniversary = 36000 (Jan 1 2026), latest = 39000
    expect(result.milesUsedThisYear).toBe(3000);
  });

  it('isOverPaceThisYear is true when history shows pace above annual allowance', () => {
    // anniversary = Jan 1 2026 (~96 days elapsed as of April 7 2026)
    // totalMilesThisYear ≈ 12000
    // If used 5000 miles in ~96 days, projected = 5000/96*365 ≈ 19,010 > 12000
    const entries = [
      { date: '2025-01-01', mileage: 0, projectedMileage: 0 },
      { date: '2026-01-01', mileage: 0, projectedMileage: 0 }, // 0 at anniversary
      { date: '2026-04-01', mileage: 5000, projectedMileage: 5000 }, // 5000 in ~90 days
    ];
    const result = computeThisYearStats(lease, summary, entries);
    expect(result.isOverPaceThisYear).toBe(true);
  });
});

describe('computeThisYearForwardBehind', () => {
  const baseStats: ThisYearStats = {
    anniversaryDate: localDate(2026, 1, 1),
    nextAnniversaryDate: localDate(2027, 1, 1),
    totalDaysThisYear: 365,
    daysElapsedThisYear: 180,
    daysRemainingThisYear: 185,
    totalMilesThisYear: 12000,
    milesUsedThisYear: 6000,
    milesRemainingThisYear: 6000,
    projectedMilesThisYear: 12000,
    isOverPaceThisYear: false,
  };

  it('returns days=0 when exactly on pace', () => {
    const exactMiles = Math.round((182 / 365) * 12000);
    const result = computeThisYearForwardBehind({
      ...baseStats,
      daysElapsedThisYear: 182,
      milesUsedThisYear: exactMiles,
    });
    expect(result.days).toBe(0);
  });

  it('returns isAhead=true when above expected mileage', () => {
    // 180 days elapsed, expected ≈ 5918, actual = 7000 → ahead
    const result = computeThisYearForwardBehind({
      ...baseStats,
      daysElapsedThisYear: 180,
      milesUsedThisYear: 7000,
    });
    expect(result.isAhead).toBe(true);
    expect(result.days).toBeGreaterThan(0);
  });

  it('returns isAhead=false when below expected mileage', () => {
    // 180 days elapsed, expected ≈ 5918, actual = 4000 → behind
    const result = computeThisYearForwardBehind({
      ...baseStats,
      daysElapsedThisYear: 180,
      milesUsedThisYear: 4000,
    });
    expect(result.isAhead).toBe(false);
    expect(result.days).toBeGreaterThan(0);
  });
});
