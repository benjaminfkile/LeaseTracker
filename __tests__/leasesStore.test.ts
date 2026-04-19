import { useLeasesStore } from '../src/stores/leasesStore';
import type { Lease } from '../src/types/api';

const makeLease = (id: string): Lease => ({
  id,
  user_id: 'user-1',
  display_name: '2023 Toyota Camry',
  make: 'Toyota',
  model: 'Camry',
  year: 2023,
  trim: null,
  color: null,
  vin: null,
  license_plate: null,
  lease_start_date: '2023-01-01',
  lease_end_date: '2026-01-01',
  total_miles_allowed: 36000,
  miles_per_year: 12000,
  starting_odometer: 0,
  current_odometer: 12000,
  overage_cost_per_mile: '0.25',
  monthly_payment: null,
  dealer_name: null,
  dealer_phone: null,
  contract_number: null,
  notes: null,
  is_active: true,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  role: 'owner',
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
