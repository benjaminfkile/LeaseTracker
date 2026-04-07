import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {
  ReadingImpactCard,
  computeExpectedMileage,
} from '../src/components/ReadingImpactCard';
import type { Lease } from '../src/types/api';

const FAKE_NOW = new Date('2024-06-15T00:00:00Z');

const mockLease: Lease = {
  id: 'lease-1',
  userId: 'user-1',
  vehicleYear: 2023,
  vehicleMake: 'Toyota',
  vehicleModel: 'Camry',
  startDate: '2023-01-01',
  endDate: '2026-01-01',
  totalMiles: 36000,
  startingMileage: 0,
  currentMileage: 12000,
  monthlyMiles: 1000,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

describe('ReadingImpactCard', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FAKE_NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <ReadingImpactCard
          lease={mockLease}
          currentMileage={12000}
          newMileage={null}
        />,
      );
    });
  });

  it('renders with default testID reading-impact-card', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ReadingImpactCard
          lease={mockLease}
          currentMileage={12000}
          newMileage={null}
        />,
      );
    });
    const card = renderer!.root.findByProps({ testID: 'reading-impact-card' });
    expect(card).toBeDefined();
  });

  it('accepts a custom testID', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ReadingImpactCard
          lease={mockLease}
          currentMileage={12000}
          newMileage={null}
          testID="my-impact-card"
        />,
      );
    });
    const card = renderer!.root.findByProps({ testID: 'my-impact-card' });
    expect(card).toBeDefined();
  });

  it('renders the Reading Impact title', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ReadingImpactCard
          lease={mockLease}
          currentMileage={12000}
          newMileage={null}
        />,
      );
    });
    const title = renderer!.root.findByProps({ testID: 'reading-impact-title' });
    expect(title.props.children).toBe('Reading Impact');
  });

  it('shows placeholder when newMileage is null', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ReadingImpactCard
          lease={mockLease}
          currentMileage={12000}
          newMileage={null}
        />,
      );
    });
    const placeholder = renderer!.root.findByProps({ testID: 'reading-impact-placeholder' });
    expect(placeholder).toBeDefined();
  });

  it('shows placeholder when newMileage equals currentMileage', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ReadingImpactCard
          lease={mockLease}
          currentMileage={12000}
          newMileage={12000}
        />,
      );
    });
    const placeholder = renderer!.root.findByProps({ testID: 'reading-impact-placeholder' });
    expect(placeholder).toBeDefined();
  });

  it('shows placeholder when newMileage is below currentMileage', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ReadingImpactCard
          lease={mockLease}
          currentMileage={12000}
          newMileage={11000}
        />,
      );
    });
    const placeholder = renderer!.root.findByProps({ testID: 'reading-impact-placeholder' });
    expect(placeholder).toBeDefined();
  });

  it('shows stats row when newMileage is above currentMileage', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ReadingImpactCard
          lease={mockLease}
          currentMileage={12000}
          newMileage={13000}
        />,
      );
    });
    const stats = renderer!.root.findByProps({ testID: 'reading-impact-stats' });
    expect(stats).toBeDefined();
  });

  it('shows correct miles added value', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ReadingImpactCard
          lease={mockLease}
          currentMileage={12000}
          newMileage={13000}
        />,
      );
    });
    const milesAdded = renderer!.root.findByProps({ testID: 'reading-impact-miles-added' });
    expect(milesAdded.props.children).toBe('+1,000 mi');
  });

  it('shows correct miles used value', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ReadingImpactCard
          lease={mockLease}
          currentMileage={12000}
          newMileage={13000}
        />,
      );
    });
    const milesUsed = renderer!.root.findByProps({ testID: 'reading-impact-miles-used' });
    expect(milesUsed.props.children).toBe('13,000 mi');
  });

  it('shows correct miles remaining value', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ReadingImpactCard
          lease={mockLease}
          currentMileage={12000}
          newMileage={13000}
        />,
      );
    });
    const milesRemaining = renderer!.root.findByProps({
      testID: 'reading-impact-miles-remaining',
    });
    expect(milesRemaining.props.children).toBe('23,000 mi');
  });

  it('shows "ahead of pace" pace message when newMileage is below expected', async () => {
    // With FAKE_NOW=2024-06-15, expected mileage for this lease is ~17,475 mi
    // newMileage=16000 is below expected → ahead of pace
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ReadingImpactCard
          lease={mockLease}
          currentMileage={12000}
          newMileage={16000}
        />,
      );
    });
    const msg = renderer!.root.findByProps({ testID: 'reading-impact-pace-message' });
    expect(msg.props.children).toContain('ahead of pace');
    expect(msg.props.children).toContain('↑');
  });

  it('shows "behind pace" pace message when newMileage is above expected', async () => {
    // newMileage=19000 is above expected (~17,475) → behind pace
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ReadingImpactCard
          lease={mockLease}
          currentMileage={12000}
          newMileage={19000}
        />,
      );
    });
    const msg = renderer!.root.findByProps({ testID: 'reading-impact-pace-message' });
    expect(msg.props.children).toContain('behind pace');
    expect(msg.props.children).toContain('↓');
  });

  it('shows "After this entry you\'ll be" prefix in pace message', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ReadingImpactCard
          lease={mockLease}
          currentMileage={12000}
          newMileage={16000}
        />,
      );
    });
    const msg = renderer!.root.findByProps({ testID: 'reading-impact-pace-message' });
    expect(msg.props.children).toContain("After this entry you'll be");
  });

  it('shows "miles" unit in pace message', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ReadingImpactCard
          lease={mockLease}
          currentMileage={12000}
          newMileage={16000}
        />,
      );
    });
    const msg = renderer!.root.findByProps({ testID: 'reading-impact-pace-message' });
    expect(msg.props.children).toContain('miles');
  });

  it('shows "exactly on pace" message when newMileage equals expected mileage', async () => {
    // Use a lease where expected mileage at the test date is exactly an integer
    // startDate=2023-01-01, endDate=2025-01-01 → totalDays=731
    // totalMiles=73100 (= 100 × 731) → at 2024-01-01 (365 days elapsed):
    // expected = (365/731) × 73100 = 36500 exactly
    jest.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    const exactLease: Lease = {
      ...mockLease,
      startDate: '2023-01-01',
      endDate: '2025-01-01',
      totalMiles: 73100,
      startingMileage: 0,
      currentMileage: 36000,
    };

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ReadingImpactCard
          lease={exactLease}
          currentMileage={36000}
          newMileage={36500}
        />,
      );
    });
    const msg = renderer!.root.findByProps({ testID: 'reading-impact-pace-message' });
    expect(msg.props.children).toContain('exactly on pace');
    expect(msg.props.children).toContain('→');
  });

  it('does not show pace message when lease is undefined', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ReadingImpactCard
          lease={undefined}
          currentMileage={12000}
          newMileage={16000}
        />,
      );
    });
    const messages = renderer!.root.findAllByProps({
      testID: 'reading-impact-pace-message',
    });
    expect(messages.length).toBe(0);
  });

  it('does not show pace message when newMileage is null', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ReadingImpactCard
          lease={mockLease}
          currentMileage={12000}
          newMileage={null}
        />,
      );
    });
    const messages = renderer!.root.findAllByProps({
      testID: 'reading-impact-pace-message',
    });
    expect(messages.length).toBe(0);
  });

  it('does not show pace message when newMileage is invalid (≤ currentMileage)', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <ReadingImpactCard
          lease={mockLease}
          currentMileage={12000}
          newMileage={12000}
        />,
      );
    });
    const messages = renderer!.root.findAllByProps({
      testID: 'reading-impact-pace-message',
    });
    expect(messages.length).toBe(0);
  });

  describe('computeExpectedMileage', () => {
    it('returns a value between startingMileage and startingMileage+totalMiles mid-lease', () => {
      const expected = computeExpectedMileage(mockLease);
      expect(expected).toBeGreaterThan(mockLease.startingMileage);
      expect(expected).toBeLessThan(mockLease.startingMileage + mockLease.totalMiles);
    });

    it('returns startingMileage when today equals startDate', () => {
      jest.setSystemTime(new Date('2023-01-01T00:00:00Z'));
      const lease: Lease = {
        ...mockLease,
        startDate: '2023-01-01',
        endDate: '2026-01-01',
        startingMileage: 5000,
        totalMiles: 36000,
      };
      const expected = computeExpectedMileage(lease);
      expect(expected).toBe(5000);
    });

    it('returns startingMileage+totalMiles when today equals endDate', () => {
      jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      const lease: Lease = {
        ...mockLease,
        startDate: '2023-01-01',
        endDate: '2026-01-01',
        startingMileage: 0,
        totalMiles: 36000,
      };
      const expected = computeExpectedMileage(lease);
      expect(Math.round(expected)).toBe(36000);
    });
  });
});
