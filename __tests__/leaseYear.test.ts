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
    { month: '2024-01', miles_driven: 1000, expected_miles: 1000 },
    { month: '2024-03', miles_driven: 2000, expected_miles: 1000 },
    { month: '2024-06', miles_driven: 3000, expected_miles: 1000 },
  ];

  it('returns cumulative miles up to and including the given month', () => {
    // April 2024 → includes Jan (1000) + Mar (2000) = 3000
    const result = getMileageAtDate(entries, localDate(2024, 4, 1));
    expect(result).toBe(3000);
  });

  it('returns cumulative miles when date matches an entry month', () => {
    // March 2024 → includes Jan (1000) + Mar (2000) = 3000
    const result = getMileageAtDate(entries, localDate(2024, 3, 1));
    expect(result).toBe(3000);
  });

  it('returns total of all entries if date is after all entries', () => {
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
    lease_start_date: '2023-01-01',
    lease_end_date: '2028-01-01',
    miles_per_year: 12000,
  };
  const summary = {
    miles_driven: 36000,
    days_remaining: 365,
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

  it('totalMilesThisYear is approximately miles_per_year', () => {
    const result = computeThisYearStats(lease, summary);
    // Full Jan-Jan year window → should be close to 12000
    expect(result.totalMilesThisYear).toBeGreaterThan(11000);
    expect(result.totalMilesThisYear).toBeLessThan(13000);
  });

  it('uses mileage history to compute milesUsedThisYear when provided', () => {
    // anniversary = Jan 1 2026, nextAnniversary = Jan 1 2027
    // Cumulative at Jan 2026 = 1000*12 + 1000*12 + 1000*12 = 36000
    // Cumulative at Apr 2026 = 36000 + 1000*3 = 39000
    const entries: { month: string; miles_driven: number; expected_miles: number }[] = [];
    // 2023: 12 months × 1000
    for (let m = 1; m <= 12; m++) entries.push({ month: `2023-${String(m).padStart(2, '0')}`, miles_driven: 1000, expected_miles: 1000 });
    // 2024: 12 months × 1000
    for (let m = 1; m <= 12; m++) entries.push({ month: `2024-${String(m).padStart(2, '0')}`, miles_driven: 1000, expected_miles: 1000 });
    // 2025: 12 months × 1000
    for (let m = 1; m <= 12; m++) entries.push({ month: `2025-${String(m).padStart(2, '0')}`, miles_driven: 1000, expected_miles: 1000 });
    // 2026: Jan-Apr × 1000
    for (let m = 1; m <= 4; m++) entries.push({ month: `2026-${String(m).padStart(2, '0')}`, miles_driven: 1000, expected_miles: 1000 });

    const result = computeThisYearStats(lease, summary, entries);
    // milesAtAnniversary (up to 2026-01) = 36000 + 1000 = 37000...
    // Wait — getMileageAtDate sums all entries where month <= targetMonth.
    // Anniversary = Jan 1 2026, targetMonth = '2026-01'
    // That includes all 2023 + 2024 + 2025 + 2026-01 = 36*1000 + 1000 = 37000
    // Today (2026-04-12), targetMonth = '2026-04'
    // That includes all through 2026-04 = 37000 + 3000 = 40000
    // milesUsedThisYear = 40000 - 37000 = 3000
    expect(result.milesUsedThisYear).toBe(3000);
  });

  it('isOverPaceThisYear is true when history shows pace above annual allowance', () => {
    // anniversary = Jan 1 2026 (~102 days elapsed as of April 12 2026)
    // totalMilesThisYear ≈ 12000
    // Cumulative at Jan 2026 = 0 (only 2025 entries with 0 miles)
    // Cumulative at Apr 2026 = 5000
    // milesUsedThisYear = 5000, projected = 5000/102*365 ≈ 17,892 > 12000
    const entries = [
      { month: '2025-01', miles_driven: 0, expected_miles: 1000 },
      { month: '2026-01', miles_driven: 0, expected_miles: 1000 }, // 0 at anniversary
      { month: '2026-04', miles_driven: 5000, expected_miles: 1000 }, // 5000 in Apr
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
