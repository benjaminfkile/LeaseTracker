import type {
  User,
  Lease,
  LeaseSummary,
  OdometerReading,
  SavedTrip,
  AlertConfig,
  LeaseMember,
  SubscriptionStatus,
  MileageHistory,
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
      // @ts-expect-error firstName no longer exists on User
      expect(user.firstName).toBeUndefined();
      // @ts-expect-error lastName no longer exists on User
      expect(user.lastName).toBeUndefined();
    });

    it('accepts a User with a premium subscription_tier and expiry', () => {
      const user: User = {
        id: 'user-2',
        email: 'pro@example.com',
        display_name: null,
        subscription_tier: 'premium',
        subscription_expires_at: '2026-12-31T23:59:59Z',
      };
      expect(user.display_name).toBeNull();
      expect(user.subscription_tier).toBe('premium');
      expect(user.subscription_expires_at).toBe('2026-12-31T23:59:59Z');
    });
  });

  describe('Lease', () => {
    it('accepts a valid Lease object with all required fields', () => {
      const lease: Lease = {
        id: 'lease-1',
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
        role: 'owner',
      };
      expect(lease.id).toBe('lease-1');
      expect(lease.year).toBe(2023);
      expect(lease.total_miles_allowed).toBe(36000);
      expect(lease.trim).toBeNull();
    });

    it('accepts a Lease with non-null optional fields and editor role', () => {
      const lease: Lease = {
        id: 'lease-2',
        user_id: 'user-1',
        display_name: '2024 Honda Accord Sport',
        make: 'Honda',
        model: 'Accord',
        year: 2024,
        trim: 'Sport',
        color: 'Blue',
        vin: '1HGCV1F30LA000000',
        license_plate: 'ABC-123',
        lease_start_date: '2024-01-01',
        lease_end_date: '2027-01-01',
        total_miles_allowed: 45000,
        miles_per_year: 15000,
        starting_odometer: 10,
        current_odometer: 5000,
        overage_cost_per_mile: '0.20',
        monthly_payment: '349.99',
        dealer_name: 'Honda of Anywhere',
        dealer_phone: '555-1234',
        contract_number: 'CN-001',
        notes: 'Lease purchased online',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-06-01T00:00:00Z',
        role: 'editor',
      };
      expect(lease.trim).toBe('Sport');
      expect(lease.role).toBe('editor');
      expect(lease.monthly_payment).toBe('349.99');
    });
  });

  describe('LeaseSummary', () => {
    it('accepts a valid LeaseSummary object', () => {
      const summary: LeaseSummary = {
        miles_driven: 12000,
        miles_remaining: 24000,
        days_elapsed: 365,
        days_remaining: 365,
        lease_length_days: 730,
        expected_miles_to_date: 11500,
        current_pace_per_month: 1050,
        pace_status: 'ahead',
        miles_over_under_pace: 500,
        projected_miles_at_end: 13000,
        projected_overage: 0,
        projected_overage_cost: 0,
        recommended_daily_miles: 33,
        reserved_trip_miles: 0,
        is_premium: false,
      };
      expect(summary.pace_status).toBe('ahead');
      expect(summary.miles_driven + summary.miles_remaining).toBe(36000);
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
        notes: 'Road trip',
        is_completed: false,
        created_at: '2024-03-20T08:00:00Z',
        updated_at: '2024-03-20T08:00:00Z',
      };
      expect(trip.estimated_miles).toBe(150);
      expect(trip.notes).toBe('Road trip');
    });

    it('accepts a SavedTrip with null trip_date and notes', () => {
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
      expect(trip.trip_date).toBeNull();
      expect(trip.notes).toBeNull();
      expect(trip.is_completed).toBe(true);
    });
  });

  describe('AlertConfig', () => {
    it('accepts a valid AlertConfig object', () => {
      const config: AlertConfig = {
        id: 'alert-1',
        lease_id: 'lease-1',
        user_id: 'user-1',
        alert_type: 'miles_threshold',
        threshold_value: 80,
        is_enabled: true,
        last_sent_at: null,
        created_at: '2024-01-01T00:00:00Z',
      };
      expect(config.alert_type).toBe('miles_threshold');
      expect(config.threshold_value).toBe(80);
      expect(config.is_enabled).toBe(true);
      expect(config.last_sent_at).toBeNull();
    });

    it('accepts an over_pace AlertConfig with null threshold_value', () => {
      const config: AlertConfig = {
        id: 'alert-2',
        lease_id: 'lease-1',
        user_id: 'user-1',
        alert_type: 'over_pace',
        threshold_value: null,
        is_enabled: false,
        last_sent_at: null,
        created_at: '2024-01-01T00:00:00Z',
      };
      expect(config.alert_type).toBe('over_pace');
      expect(config.threshold_value).toBeNull();
      expect(config.is_enabled).toBe(false);
    });

    it('accepts a days_remaining AlertConfig with a last_sent_at timestamp', () => {
      const config: AlertConfig = {
        id: 'alert-3',
        lease_id: 'lease-1',
        user_id: 'user-1',
        alert_type: 'days_remaining',
        threshold_value: 30,
        is_enabled: true,
        last_sent_at: '2024-06-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
      };
      expect(config.alert_type).toBe('days_remaining');
      expect(config.last_sent_at).toBe('2024-06-01T00:00:00Z');
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
        created_at: '2024-01-01T00:00:00Z',
        display_name: 'Owner User',
        email: 'owner@example.com',
      };
      expect(member.role).toBe('owner');
      expect(member.lease_id).toBe('lease-1');
      expect(member.user_id).toBe('user-1');
      expect(member.display_name).toBe('Owner User');
      expect(member.invited_by).toBeNull();
    });

    it('accepts a member with viewer role', () => {
      const member: LeaseMember = {
        id: 'member-2',
        lease_id: 'lease-1',
        user_id: 'user-2',
        role: 'viewer',
        invited_by: 'user-1',
        accepted_at: null,
        created_at: '2024-01-01T00:00:00Z',
        display_name: null,
        email: 'viewer@example.com',
      };
      expect(member.role).toBe('viewer');
      expect(member.invited_by).toBe('user-1');
      expect(member.accepted_at).toBeNull();
      expect(member.display_name).toBeNull();
      expect(member.email).toBe('viewer@example.com');
    });
  });

  describe('SubscriptionStatus', () => {
    it('accepts a premium iOS subscription', () => {
      const status: SubscriptionStatus = {
        is_active: true,
        expires_at: '2025-12-31T23:59:59Z',
        platform: 'ios',
        product_id: 'com.benkile.leasetracker.premium.monthly',
      };
      expect(status.is_active).toBe(true);
      expect(status.platform).toBe('ios');
      expect(status.product_id).toBe('com.benkile.leasetracker.premium.monthly');
      // @ts-expect-error isPremium no longer exists on SubscriptionStatus
      expect(status.isPremium).toBeUndefined();
      // @ts-expect-error tier no longer exists on SubscriptionStatus
      expect(status.tier).toBeUndefined();
    });

    it('accepts a free status with null nullable fields', () => {
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
        miles_driven: 12000,
        expected_miles: 11500,
      };
      expect(entry.miles_driven).toBe(12000);
      expect(entry.expected_miles).toBe(11500);
    });
  });

  describe('MileageHistory', () => {
    it('accepts a MileageHistory with multiple entries', () => {
      const history: MileageHistory = [
        { month: '2024-01', miles_driven: 5000, expected_miles: 5000 },
        { month: '2024-02', miles_driven: 6200, expected_miles: 6000 },
        { month: '2024-03', miles_driven: 7500, expected_miles: 7000 },
      ];
      expect(history).toHaveLength(3);
      expect(history[0].month).toBe('2024-01');
    });

    it('accepts a MileageHistory with an empty array', () => {
      const history: MileageHistory = [];
      expect(history).toHaveLength(0);
    });
  });
});
