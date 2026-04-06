import { useLeasesStore } from '../src/stores/leasesStore';
import type { Lease } from '../src/types/api';

const makeLease = (id: string): Lease => ({
  id,
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
});

describe('leasesStore', () => {
  beforeEach(() => {
    useLeasesStore.setState({
      leases: [],
      overPaceCount: 0,
      activeLeaseId: null,
    });
  });

  it('has the correct initial state', () => {
    const state = useLeasesStore.getState();
    expect(state.leases).toEqual([]);
    expect(state.overPaceCount).toBe(0);
    expect(state.activeLeaseId).toBeNull();
  });

  it('setLeases updates the leases array', () => {
    const leases = [makeLease('lease-1'), makeLease('lease-2')];
    useLeasesStore.getState().setLeases(leases);
    expect(useLeasesStore.getState().leases).toEqual(leases);
  });

  it('setOverPaceCount updates overPaceCount', () => {
    useLeasesStore.getState().setOverPaceCount(3);
    expect(useLeasesStore.getState().overPaceCount).toBe(3);
  });

  it('setActiveLeaseId updates activeLeaseId', () => {
    useLeasesStore.getState().setActiveLeaseId('lease-1');
    expect(useLeasesStore.getState().activeLeaseId).toBe('lease-1');
  });

  it('setActiveLeaseId can be set to null', () => {
    useLeasesStore.getState().setActiveLeaseId('lease-1');
    useLeasesStore.getState().setActiveLeaseId(null);
    expect(useLeasesStore.getState().activeLeaseId).toBeNull();
  });

  it('setActiveLeaseId can be updated to a different lease id', () => {
    useLeasesStore.getState().setActiveLeaseId('lease-1');
    useLeasesStore.getState().setActiveLeaseId('lease-2');
    expect(useLeasesStore.getState().activeLeaseId).toBe('lease-2');
  });

  it('setLeases does not affect activeLeaseId', () => {
    useLeasesStore.getState().setActiveLeaseId('lease-1');
    useLeasesStore.getState().setLeases([makeLease('lease-2')]);
    expect(useLeasesStore.getState().activeLeaseId).toBe('lease-1');
  });

  it('setActiveLeaseId does not affect leases', () => {
    const leases = [makeLease('lease-1')];
    useLeasesStore.getState().setLeases(leases);
    useLeasesStore.getState().setActiveLeaseId('lease-1');
    expect(useLeasesStore.getState().leases).toEqual(leases);
  });
});
