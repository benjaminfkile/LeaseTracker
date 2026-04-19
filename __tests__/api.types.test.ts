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
        firstName: 'Jane',
        lastName: 'Doe',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
      };
      expect(user.id).toBe('user-1');
      expect(user.email).toBe('test@example.com');
      expect(user.firstName).toBe('Jane');
      expect(user.lastName).toBe('Doe');
      expect(typeof user.createdAt).toBe('string');
      expect(typeof user.updatedAt).toBe('string');
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
        leaseId: 'lease-1',
        vehicleLabel: '2023 Toyota Camry',
        startDate: '2023-01-01',
        endDate: '2026-01-01',
        totalMiles: 36000,
        milesUsed: 12000,
        milesRemaining: 24000,
        daysRemaining: 365,
        projectedMiles: 13000,
        isOverPace: true,
      };
      expect(summary.leaseId).toBe('lease-1');
      expect(summary.isOverPace).toBe(true);
      expect(summary.milesUsed + summary.milesRemaining).toBe(summary.totalMiles);
    });
  });

  describe('OdometerReading', () => {
    it('accepts a valid OdometerReading with all fields', () => {
      const reading: OdometerReading = {
        id: 'reading-1',
        leaseId: 'lease-1',
        mileage: 12500,
        readingDate: '2024-03-15',
        note: 'Monthly reading',
        createdAt: '2024-03-15T10:00:00Z',
      };
      expect(reading.mileage).toBe(12500);
      expect(reading.note).toBe('Monthly reading');
    });

    it('accepts an OdometerReading without optional note', () => {
      const reading: OdometerReading = {
        id: 'reading-2',
        leaseId: 'lease-1',
        mileage: 13000,
        readingDate: '2024-04-15',
        createdAt: '2024-04-15T10:00:00Z',
      };
      expect(reading.note).toBeUndefined();
    });
  });

  describe('SavedTrip', () => {
    it('accepts a valid SavedTrip with all fields', () => {
      const trip: SavedTrip = {
        id: 'trip-1',
        leaseId: 'lease-1',
        distance: 150,
        tripDate: '2024-03-20',
        note: 'Road trip',
        createdAt: '2024-03-20T08:00:00Z',
        updatedAt: '2024-03-20T08:00:00Z',
      };
      expect(trip.distance).toBe(150);
      expect(trip.note).toBe('Road trip');
    });

    it('accepts a SavedTrip without optional note', () => {
      const trip: SavedTrip = {
        id: 'trip-2',
        leaseId: 'lease-1',
        distance: 25,
        tripDate: '2024-04-01',
        createdAt: '2024-04-01T09:00:00Z',
        updatedAt: '2024-04-01T09:00:00Z',
      };
      expect(trip.note).toBeUndefined();
    });
  });

  describe('AlertConfig', () => {
    it('accepts a valid AlertConfig object', () => {
      const config: AlertConfig = {
        id: 'alert-1',
        leaseId: 'lease-1',
        overPaceThresholdPercent: 10,
        projectedOverageThresholdMiles: 500,
        notifyEmail: true,
        notifyPush: false,
        approachingLimitEnabled: false,
        approachingLimitPercent: 80,
        overPaceEnabled: false,
        leaseEndEnabled: false,
        leaseEndDays: 30,
        savedTripEnabled: false,
        mileageBuybackEnabled: false,
        mileageBuybackThresholdDollars: 50,
        weeklySummaryEnabled: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };
      expect(config.overPaceThresholdPercent).toBe(10);
      expect(config.notifyEmail).toBe(true);
      expect(config.notifyPush).toBe(false);
    });
  });

  describe('LeaseMember', () => {
    it('accepts a member with owner role', () => {
      const member: LeaseMember = {
        id: 'member-1',
        leaseId: 'lease-1',
        userId: 'user-1',
        email: 'owner@example.com',
        role: 'owner',
        createdAt: '2024-01-01T00:00:00Z',
      };
      expect(member.role).toBe('owner');
    });

    it('accepts a member with viewer role', () => {
      const member: LeaseMember = {
        id: 'member-2',
        leaseId: 'lease-1',
        userId: 'user-2',
        email: 'viewer@example.com',
        role: 'viewer',
        createdAt: '2024-01-01T00:00:00Z',
      };
      expect(member.role).toBe('viewer');
    });
  });

  describe('SubscriptionStatus', () => {
    it('accepts a premium iOS subscription', () => {
      const status: SubscriptionStatus = {
        isPremium: true,
        tier: 'premium',
        expiresAt: '2025-12-31T23:59:59Z',
        platform: 'ios',
        productId: 'com.benkile.leasetracker.premium.monthly',
      };
      expect(status.isPremium).toBe(true);
      expect(status.tier).toBe('premium');
      expect(status.platform).toBe('ios');
    });

    it('accepts a free tier with null nullable fields', () => {
      const status: SubscriptionStatus = {
        isPremium: false,
        tier: 'free',
        expiresAt: null,
        platform: null,
        productId: null,
      };
      expect(status.isPremium).toBe(false);
      expect(status.tier).toBe('free');
      expect(status.expiresAt).toBeNull();
      expect(status.platform).toBeNull();
      expect(status.productId).toBeNull();
    });

    it('accepts an android subscription', () => {
      const status: SubscriptionStatus = {
        isPremium: true,
        tier: 'premium',
        expiresAt: '2025-06-30T23:59:59Z',
        platform: 'android',
        productId: 'com.benkile.leasetracker.premium.annual',
      };
      expect(status.platform).toBe('android');
    });
  });

  describe('MileageHistoryEntry', () => {
    it('accepts a valid MileageHistoryEntry', () => {
      const entry: MileageHistoryEntry = {
        date: '2024-03-01',
        mileage: 12000,
        projectedMileage: 11500,
      };
      expect(entry.mileage).toBe(12000);
      expect(entry.projectedMileage).toBe(11500);
    });
  });

  describe('MileageHistory', () => {
    it('accepts a MileageHistory with multiple entries', () => {
      const history: MileageHistory = {
        leaseId: 'lease-1',
        entries: [
          { date: '2024-01-01', mileage: 5000, projectedMileage: 5000 },
          { date: '2024-02-01', mileage: 6200, projectedMileage: 6000 },
          { date: '2024-03-01', mileage: 7500, projectedMileage: 7000 },
        ],
      };
      expect(history.leaseId).toBe('lease-1');
      expect(history.entries).toHaveLength(3);
      expect(history.entries[0].date).toBe('2024-01-01');
    });

    it('accepts a MileageHistory with an empty entries array', () => {
      const history: MileageHistory = {
        leaseId: 'lease-2',
        entries: [],
      };
      expect(history.entries).toHaveLength(0);
    });
  });
});
