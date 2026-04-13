import type {
  User,
  Lease,
  LeaseSummary,
  OdometerReading,
  SavedTrip,
  AlertConfig,
  LeaseMember,
  SubscriptionStatus,
  MileageHistoryEntry,
} from '../src/types/api';

describe('API types', () => {
  describe('User', () => {
    it('accepts a valid User object', () => {
      const user: User = {
        id: 'user-1',
        email: 'test@example.com',
        display_name: 'Jane Doe',
        subscription_tier: 'free',
        subscription_expires_at: null,
      };
      expect(user.id).toBe('user-1');
      expect(user.email).toBe('test@example.com');
      expect(user.display_name).toBe('Jane Doe');
      expect(user.subscription_tier).toBe('free');
      expect(user.subscription_expires_at).toBeNull();
    });
  });

  describe('Lease', () => {
    it('accepts a valid Lease object with all required fields', () => {
      const lease: Lease = {
        id: 'lease-1',
        user_id: 'user-1',
        display_name: 'My Camry',
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
        starting_odometer: 5,
        current_odometer: 12000,
        overage_cost_per_mile: '0.25',
        monthly_payment: null,
        dealer_name: null,
        dealer_phone: null,
        contract_number: null,
        notes: null,
        is_active: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      expect(lease.id).toBe('lease-1');
      expect(lease.year).toBe(2023);
      expect(lease.total_miles_allowed).toBe(36000);
      expect(lease.trim).toBeNull();
    });

    it('accepts a Lease with optional role', () => {
      const lease: Lease = {
        id: 'lease-2',
        user_id: 'user-1',
        display_name: 'My Accord',
        make: 'Honda',
        model: 'Accord',
        year: 2024,
        trim: 'Sport',
        color: 'Blue',
        vin: null,
        license_plate: null,
        lease_start_date: '2024-01-01',
        lease_end_date: '2027-01-01',
        total_miles_allowed: 45000,
        miles_per_year: 15000,
        starting_odometer: 10,
        current_odometer: 5000,
        overage_cost_per_mile: '0.20',
        monthly_payment: '450.00',
        dealer_name: null,
        dealer_phone: null,
        contract_number: null,
        notes: null,
        is_active: true,
        role: 'owner',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-06-01T00:00:00Z',
      };
      expect(lease.trim).toBe('Sport');
      expect(lease.role).toBe('owner');
    });
  });

  describe('LeaseSummary', () => {
    it('accepts a valid LeaseSummary object', () => {
      const summary: LeaseSummary = {
        miles_driven: 12000,
        miles_remaining: 24000,
        days_elapsed: 365,
        days_remaining: 730,
        lease_length_days: 1095,
        expected_miles_to_date: 12000,
        current_pace_per_month: 1000,
        pace_status: 'ahead',
        miles_over_under_pace: 500,
        projected_miles_at_end: 39000,
        projected_overage: 3000,
        projected_overage_cost: 750,
        recommended_daily_miles: 32.88,
        reserved_trip_miles: 0,
        is_premium: false,
      };
      expect(summary.pace_status).toBe('ahead');
      expect(summary.miles_driven).toBe(12000);
      expect(summary.miles_remaining).toBe(24000);
    });
  });

  describe('OdometerReading', () => {
    it('accepts a valid OdometerReading with all fields', () => {
      const reading: OdometerReading = {
        id: 'reading-1',
        lease_id: 'lease-1',
        user_id: 'user-1',
        odometer: 12500,
        reading_date: '2024-03-15',
        notes: 'Monthly reading',
        source: 'manual',
        created_at: '2024-03-15T10:00:00Z',
      };
      expect(reading.odometer).toBe(12500);
      expect(reading.notes).toBe('Monthly reading');
    });

    it('accepts an OdometerReading with null notes', () => {
      const reading: OdometerReading = {
        id: 'reading-2',
        lease_id: 'lease-1',
        user_id: 'user-1',
        odometer: 13000,
        reading_date: '2024-04-15',
        notes: null,
        source: 'manual',
        created_at: '2024-04-15T10:00:00Z',
      };
      expect(reading.notes).toBeNull();
    });
  });

  describe('SavedTrip', () => {
    it('accepts a valid SavedTrip with all fields', () => {
      const trip: SavedTrip = {
        id: 'trip-1',
        lease_id: 'lease-1',
        user_id: 'user-1',
        name: 'Road trip',
        estimated_miles: 150,
        trip_date: '2024-03-20',
        notes: 'Spring break trip',
        is_completed: false,
        created_at: '2024-03-20T08:00:00Z',
        updated_at: '2024-03-20T08:00:00Z',
      };
      expect(trip.estimated_miles).toBe(150);
      expect(trip.notes).toBe('Spring break trip');
    });

    it('accepts a SavedTrip with null optional fields', () => {
      const trip: SavedTrip = {
        id: 'trip-2',
        lease_id: 'lease-1',
        user_id: 'user-1',
        name: 'Quick errand',
        estimated_miles: 25,
        trip_date: null,
        notes: null,
        is_completed: true,
        created_at: '2024-04-01T09:00:00Z',
        updated_at: '2024-04-01T09:00:00Z',
      };
      expect(trip.notes).toBeNull();
    });
  });

  describe('AlertConfig', () => {
    it('accepts a valid AlertConfig object', () => {
      const config: AlertConfig = {
        id: 'alert-1',
        lease_id: 'lease-1',
        user_id: 'user-1',
        alert_type: 'miles_threshold',
        threshold_value: 500,
        is_enabled: true,
        last_sent_at: null,
        created_at: '2024-01-01T00:00:00Z',
      };
      expect(config.alert_type).toBe('miles_threshold');
      expect(config.is_enabled).toBe(true);
      expect(config.threshold_value).toBe(500);
    });
  });

  describe('LeaseMember', () => {
    it('accepts a member with owner role', () => {
      const member: LeaseMember = {
        id: 'member-1',
        lease_id: 'lease-1',
        user_id: 'user-1',
        role: 'owner',
        invited_by: null,
        accepted_at: '2024-01-01T00:00:00Z',
        display_name: 'Jane Doe',
        email: 'owner@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };
      expect(member.role).toBe('owner');
    });

    it('accepts a member with viewer role', () => {
      const member: LeaseMember = {
        id: 'member-2',
        lease_id: 'lease-1',
        user_id: 'user-2',
        role: 'viewer',
        invited_by: 'user-1',
        accepted_at: null,
        display_name: null,
        email: 'viewer@example.com',
        created_at: '2024-01-01T00:00:00Z',
      };
      expect(member.role).toBe('viewer');
    });
  });

  describe('SubscriptionStatus', () => {
    it('accepts an active subscription', () => {
      const status: SubscriptionStatus = {
        is_active: true,
        expires_at: '2025-12-31T23:59:59Z',
        platform: 'ios',
        product_id: 'com.benkile.leasetracker.premium.monthly',
      };
      expect(status.is_active).toBe(true);
      expect(status.platform).toBe('ios');
    });

    it('accepts an inactive subscription with null nullable fields', () => {
      const status: SubscriptionStatus = {
        is_active: false,
        expires_at: null,
        platform: null,
        product_id: null,
      };
      expect(status.is_active).toBe(false);
      expect(status.expires_at).toBeNull();
      expect(status.platform).toBeNull();
      expect(status.product_id).toBeNull();
    });

    it('accepts an android subscription', () => {
      const status: SubscriptionStatus = {
        is_active: true,
        expires_at: '2025-06-30T23:59:59Z',
        platform: 'android',
        product_id: 'com.benkile.leasetracker.premium.annual',
      };
      expect(status.platform).toBe('android');
    });
  });

  describe('MileageHistoryEntry', () => {
    it('accepts a valid MileageHistoryEntry', () => {
      const entry: MileageHistoryEntry = {
        month: '2024-03',
        miles_driven: 1200,
        expected_miles: 1000,
      };
      expect(entry.miles_driven).toBe(1200);
      expect(entry.expected_miles).toBe(1000);
    });
  });
});
