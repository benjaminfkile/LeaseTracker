import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { LeaseSelectorPills } from '../src/components/LeaseSelectorPills';
import type { Lease } from '../src/types/api';

const makeLease = (id: string, year: number, make: string, model: string): Lease => ({
  id,
  userId: 'user-1',
  vehicleYear: year,
  vehicleMake: make,
  vehicleModel: model,
  startDate: '2023-01-01',
  endDate: '2026-01-01',
  totalMiles: 36000,
  startingMileage: 0,
  currentMileage: 12000,
  monthlyMiles: 1000,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
});

const leases: Lease[] = [
  makeLease('lease-1', 2023, 'Toyota', 'Camry'),
  makeLease('lease-2', 2022, 'Honda', 'Civic'),
];

describe('LeaseSelectorPills', () => {
  it('renders without crashing', async () => {
    await ReactTestRenderer.act(() => {
      ReactTestRenderer.create(
        <LeaseSelectorPills
          leases={leases}
          selectedId="lease-1"
          onSelect={jest.fn()}
        />,
      );
    });
  });

  it('renders with testID lease-selector-pills', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseSelectorPills
          leases={leases}
          selectedId="lease-1"
          onSelect={jest.fn()}
        />,
      );
    });
    const container = renderer!.root.findByProps({ testID: 'lease-selector-pills' });
    expect(container).toBeDefined();
  });

  it('renders a pill for each lease', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseSelectorPills
          leases={leases}
          selectedId="lease-1"
          onSelect={jest.fn()}
        />,
      );
    });
    const pill1 = renderer!.root.findByProps({ testID: 'lease-pill-lease-1' });
    const pill2 = renderer!.root.findByProps({ testID: 'lease-pill-lease-2' });
    expect(pill1).toBeDefined();
    expect(pill2).toBeDefined();
  });

  it('marks the selected pill with accessibilityState selected=true', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseSelectorPills
          leases={leases}
          selectedId="lease-1"
          onSelect={jest.fn()}
        />,
      );
    });
    const selectedPill = renderer!.root.findByProps({ testID: 'lease-pill-lease-1' });
    expect(selectedPill.props.accessibilityState).toEqual({ selected: true });
  });

  it('marks non-selected pills with accessibilityState selected=false', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseSelectorPills
          leases={leases}
          selectedId="lease-1"
          onSelect={jest.fn()}
        />,
      );
    });
    const unselectedPill = renderer!.root.findByProps({ testID: 'lease-pill-lease-2' });
    expect(unselectedPill.props.accessibilityState).toEqual({ selected: false });
  });

  it('calls onSelect with the correct leaseId when a pill is pressed', async () => {
    const onSelect = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseSelectorPills
          leases={leases}
          selectedId="lease-1"
          onSelect={onSelect}
        />,
      );
    });
    const pill2 = renderer!.root.findByProps({ testID: 'lease-pill-lease-2' });
    await ReactTestRenderer.act(() => {
      pill2.props.onPress();
    });
    expect(onSelect).toHaveBeenCalledWith('lease-2');
  });

  it('renders an empty scroll view when leases list is empty', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <LeaseSelectorPills leases={[]} selectedId="" onSelect={jest.fn()} />,
      );
    });
    const container = renderer!.root.findByProps({ testID: 'lease-selector-pills' });
    expect(container).toBeDefined();
  });
});
