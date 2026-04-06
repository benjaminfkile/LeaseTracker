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
});
