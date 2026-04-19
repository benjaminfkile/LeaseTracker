export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
};

export type Lease = {
  id: string;
  user_id: string;
  display_name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  trim: string | null;
  color: string | null;
  vin: string | null;
  license_plate: string | null;
  lease_start_date: string;
  lease_end_date: string;
  total_miles_allowed: number;
  miles_per_year: number;
  starting_odometer: number;
  current_odometer: number | null;
  overage_cost_per_mile: string;
  monthly_payment: string | null;
  dealer_name: string | null;
  dealer_phone: string | null;
  contract_number: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role: 'owner' | 'editor' | 'viewer';
};

export type LeaseSummary = {
  miles_driven: number;
  miles_remaining: number;
  days_elapsed: number;
  days_remaining: number;
  lease_length_days: number;
  expected_miles_to_date: number;
  current_pace_per_month: number;
  pace_status: 'ahead' | 'on_track' | 'behind';
  miles_over_under_pace: number;
  projected_miles_at_end: number;
  projected_overage: number;
  projected_overage_cost: number;
  recommended_daily_miles: number;
  reserved_trip_miles: number;
  is_premium: boolean;
};

export type OdometerReading = {
  id: string;
  leaseId: string;
  mileage: number;
  readingDate: string;
  note?: string;
  loggedByName?: string;
  createdAt: string;
};

export type SavedTrip = {
  id: string;
  leaseId: string;
  distance: number;
  tripDate: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type AlertConfig = {
  id: string;
  leaseId: string;
  overPaceThresholdPercent: number;
  projectedOverageThresholdMiles: number;
  notifyEmail: boolean;
  notifyPush: boolean;
  approachingLimitEnabled: boolean;
  approachingLimitPercent: number;
  overPaceEnabled: boolean;
  leaseEndEnabled: boolean;
  leaseEndDays: number;
  savedTripEnabled: boolean;
  mileageBuybackEnabled: boolean;
  mileageBuybackThresholdDollars: number;
  weeklySummaryEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LeaseMember = {
  id: string;
  leaseId: string;
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'owner' | 'editor' | 'viewer';
  createdAt: string;
};

export type InviteMemberInput = {
  email: string;
  role: 'editor' | 'viewer';
};

export type SubscriptionStatus = {
  isPremium: boolean;
  tier: 'free' | 'premium';
  expiresAt: string | null;
  platform: 'ios' | 'android' | null;
  productId: string | null;
};

export type MileageHistoryEntry = {
  month: string;
  miles_driven: number;
  expected_miles: number;
};

export type MileageHistory = MileageHistoryEntry[];

export type CreateLeaseInput = {
  display_name: string;
  lease_start_date: string;
  lease_end_date: string;
  total_miles_allowed: number;
  miles_per_year: number;
  overage_cost_per_mile: number;
  make?: string;
  model?: string;
  year?: number;
  trim?: string;
  color?: string;
  vin?: string;
  license_plate?: string;
  starting_odometer?: number;
  current_odometer?: number;
  monthly_payment?: number;
  dealer_name?: string;
  dealer_phone?: string;
  contract_number?: string;
  notes?: string;
  is_active?: boolean;
};

export type UpdateLeaseInput = Partial<CreateLeaseInput>;

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type CreateReadingInput = {
  mileage: number;
  readingDate: string;
  note?: string;
};

export type UpdateReadingInput = Partial<CreateReadingInput>;

export type CreateTripInput = {
  distance: number;
  tripDate: string;
  note?: string;
};

export type UpdateTripInput = Partial<CreateTripInput> & { completed?: boolean };

export type UpdateAlertConfigInput = Partial<
  Pick<
    AlertConfig,
    | 'overPaceThresholdPercent'
    | 'projectedOverageThresholdMiles'
    | 'notifyEmail'
    | 'notifyPush'
    | 'approachingLimitEnabled'
    | 'approachingLimitPercent'
    | 'overPaceEnabled'
    | 'leaseEndEnabled'
    | 'leaseEndDays'
    | 'savedTripEnabled'
    | 'mileageBuybackEnabled'
    | 'mileageBuybackThresholdDollars'
    | 'weeklySummaryEnabled'
  >
>;

export type UpdateUserInput = Partial<Pick<User, 'firstName' | 'lastName'>>;
