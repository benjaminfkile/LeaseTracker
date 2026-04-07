jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Swipeable: ({
      children,
      renderRightActions,
      testID,
    }: {
      children?: React.ReactNode;
      renderRightActions?: () => React.ReactNode;
      testID?: string;
    }) =>
      React.createElement(
        View,
        { testID },
        children,
        renderRightActions != null ? renderRightActions() : null,
      ),
    GestureHandlerRootView: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, {}, children),
  };
});

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { LeaseCard } from '../src/components/LeaseCard';
import type { Lease } from '../src/types/api';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Fixed "now" so date-dependent assertions are deterministic
const FAKE_NOW = new Date('2024-06-15T00:00:00Z');

const mockLease: Lease = {
  id: 'lease-1',
  userId: 'user-1',
  vehicleYear: 2023,
  vehicleMake: 'Toyota',
  vehicleModel: 'Camry',
  vehicleTrim: 'SE',
  startDate: '2023-01-01',
  endDate: '2026-01-01',
  totalMiles: 36000,
  startingMileage: 0,
  currentMileage: 12000,
  monthlyMiles: 1000,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

describe('LeaseCard', () => {
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
        <LeaseCard lease={mockLease} onArchive={jest.fn()} />,
      );
    });
  });

  it('renders the vehicle label with trim', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={mockLease} onArchive={jest.fn()} />,
      );
    });
    const label = renderer!.root.findByProps({ testID: 'lease-card-vehicle-label' });
    expect(label.props.children).toBe('2023 Toyota Camry SE');
  });

  it('renders the vehicle label without trim when vehicleTrim is absent', async () => {
    const leaseNoTrim: Lease = { ...mockLease, vehicleTrim: undefined };
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={leaseNoTrim} onArchive={jest.fn()} />,
      );
    });
    const label = renderer!.root.findByProps({ testID: 'lease-card-vehicle-label' });
    expect(label.props.children).toBe('2023 Toyota Camry');
  });

  it('renders the mileage stat', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={mockLease} onArchive={jest.fn()} />,
      );
    });
    const mileage = renderer!.root.findByProps({ testID: 'lease-card-mileage' });
    expect(mileage.props.children).toBe('12,000 / 36,000 mi');
  });

  it('renders the monthly miles stat', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={mockLease} onArchive={jest.fn()} />,
      );
    });
    const monthly = renderer!.root.findByProps({ testID: 'lease-card-monthly' });
    expect(monthly.props.children).toBe('1,000 mi/mo');
  });

  it('renders with a custom testID', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={mockLease} onArchive={jest.fn()} testID="my-lease-card" />,
      );
    });
    const card = renderer!.root.findByProps({ testID: 'my-lease-card' });
    expect(card).toBeDefined();
  });

  it('renders with default testID lease-card', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={mockLease} onArchive={jest.fn()} />,
      );
    });
    const card = renderer!.root.findByProps({ testID: 'lease-card' });
    expect(card).toBeDefined();
  });

  it('renders the archive action button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={mockLease} onArchive={jest.fn()} />,
      );
    });
    const archiveBtn = renderer!.root.findByProps({ testID: 'lease-card-archive-action' });
    expect(archiveBtn).toBeDefined();
  });

  it('calls onArchive with the lease id when archive is pressed', async () => {
    const onArchive = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={mockLease} onArchive={onArchive} />,
      );
    });
    const archiveBtn = renderer!.root.findByProps({ testID: 'lease-card-archive-action' });
    await ReactTestRenderer.act(() => {
      archiveBtn.props.onPress();
    });
    expect(onArchive).toHaveBeenCalledWith('lease-1');
  });

  it('calls onPress with the lease id when card is tapped', async () => {
    const onPress = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={mockLease} onArchive={jest.fn()} onPress={onPress} />,
      );
    });
    const touchable = renderer!.root.findByProps({ testID: 'lease-card' });
    await ReactTestRenderer.act(() => {
      touchable.props.onPress();
    });
    expect(onPress).toHaveBeenCalledWith('lease-1');
  });

  // --- Progress bar ---

  it('renders the progress bar', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={mockLease} onArchive={jest.fn()} />,
      );
    });
    const bar = renderer!.root.findByProps({ testID: 'lease-card-progress-bar' });
    expect(bar).toBeDefined();
  });

  it('progress bar fill flex equals miles-used / totalMiles ratio', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={mockLease} onArchive={jest.fn()} />,
      );
    });
    const bar = renderer!.root.findByProps({ testID: 'lease-card-progress-bar' });
    // First child is the filled portion; flex should equal milesUsed/totalMiles
    const fillStyle = bar.props.children[0].props.style;
    const flatStyle = Array.isArray(fillStyle) ? Object.assign({}, ...fillStyle) : fillStyle;
    const expected = (mockLease.currentMileage - mockLease.startingMileage) / mockLease.totalMiles;
    expect(flatStyle.flex).toBeCloseTo(expected, 5);
  });

  it('progress bar fill is capped at 1 when miles exceed total', async () => {
    const overLease: Lease = { ...mockLease, currentMileage: 40000 };
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={overLease} onArchive={jest.fn()} />,
      );
    });
    const bar = renderer!.root.findByProps({ testID: 'lease-card-progress-bar' });
    const fillStyle = bar.props.children[0].props.style;
    const flatStyle = Array.isArray(fillStyle) ? Object.assign({}, ...fillStyle) : fillStyle;
    expect(flatStyle.flex).toBe(1);
  });

  // --- Days left chip ---

  it('renders the days-left chip', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={mockLease} onArchive={jest.fn()} />,
      );
    });
    const chip = renderer!.root.findByProps({ testID: 'lease-card-days-left' });
    expect(chip).toBeDefined();
  });

  it('days-left chip shows correct days remaining', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={mockLease} onArchive={jest.fn()} />,
      );
    });
    const chip = renderer!.root.findByProps({ testID: 'lease-card-days-left' });
    const textEl = chip.findByType(require('react-native').Text);
    const expectedDays = Math.ceil(
      (new Date(mockLease.endDate).getTime() - FAKE_NOW.getTime()) / MS_PER_DAY,
    );
    expect(textEl.props.children).toBe(`${expectedDays} days left`);
  });

  it('days-left chip shows 0 when lease is expired', async () => {
    const expiredLease: Lease = { ...mockLease, endDate: '2020-01-01' };
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={expiredLease} onArchive={jest.fn()} />,
      );
    });
    const chip = renderer!.root.findByProps({ testID: 'lease-card-days-left' });
    const textEl = chip.findByType(require('react-native').Text);
    expect(textEl.props.children).toBe('0 days left');
  });

  // --- Pace status chip ---

  it('renders the pace chip', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={mockLease} onArchive={jest.fn()} />,
      );
    });
    const chip = renderer!.root.findByProps({ testID: 'lease-card-pace-chip' });
    expect(chip).toBeDefined();
  });

  it('pace chip shows On Track when miles used is below expected', async () => {
    // mockLease: 12,000 used out of 36,000 total; ~530/1096 elapsed → expected ~17,000+ → on-track
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={mockLease} onArchive={jest.fn()} />,
      );
    });
    const chip = renderer!.root.findByProps({ testID: 'lease-card-pace-chip' });
    const textEl = chip.findByType(require('react-native').Text);
    expect(textEl.props.children).toBe('On Track');
  });

  it('pace chip shows Slightly Over when miles are slightly above expected', async () => {
    // Use a lease where elapsed is 50% but miles used is just above 50% of total
    const slightlyOverLease: Lease = {
      ...mockLease,
      startDate: '2024-01-01',
      endDate: '2025-01-01',
      totalMiles: 12000,
      startingMileage: 0,
      // Fake now = 2024-06-15; elapsed ≈ 165/365 → expected ≈ 5425 mi; 5500 is >5425 but <1.1×5425=5968
      currentMileage: 5500,
    };
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={slightlyOverLease} onArchive={jest.fn()} />,
      );
    });
    const chip = renderer!.root.findByProps({ testID: 'lease-card-pace-chip' });
    const textEl = chip.findByType(require('react-native').Text);
    expect(textEl.props.children).toBe('Slightly Over');
  });

  it('pace chip shows Over Pace when miles are more than 10% above expected', async () => {
    // elapsed ≈ 165/365 → expected ≈ 5425; 7000 > 1.1×5425=5968 → over-pace
    const overPaceLease: Lease = {
      ...mockLease,
      startDate: '2024-01-01',
      endDate: '2025-01-01',
      totalMiles: 12000,
      startingMileage: 0,
      currentMileage: 7000,
    };
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={overPaceLease} onArchive={jest.fn()} />,
      );
    });
    const chip = renderer!.root.findByProps({ testID: 'lease-card-pace-chip' });
    const textEl = chip.findByType(require('react-native').Text);
    expect(textEl.props.children).toBe('Over Pace');
  });

  // --- Shared badge ---

  it('does not render the shared badge by default', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={mockLease} onArchive={jest.fn()} />,
      );
    });
    const badges = renderer!.root.findAllByProps({ testID: 'lease-card-shared-badge' });
    expect(badges.length).toBe(0);
  });

  it('does not render the shared badge when isShared is false', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={mockLease} onArchive={jest.fn()} isShared={false} />,
      );
    });
    const badges = renderer!.root.findAllByProps({ testID: 'lease-card-shared-badge' });
    expect(badges.length).toBe(0);
  });

  it('renders the shared badge when isShared is true', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={mockLease} onArchive={jest.fn()} isShared />,
      );
    });
    const badge = renderer!.root.findByProps({ testID: 'lease-card-shared-badge' });
    expect(badge).toBeDefined();
  });

  it('shared badge displays the text Shared', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseCard lease={mockLease} onArchive={jest.fn()} isShared />,
      );
    });
    const badge = renderer!.root.findByProps({ testID: 'lease-card-shared-badge' });
    const textEl = badge.findByType(require('react-native').Text);
    expect(textEl.props.children).toBe('Shared');
  });
});
