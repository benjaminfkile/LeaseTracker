// Lease — matches backend ILease + ILeaseWithRole
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
  miles_per_year: number;          // NOTE: yearly, not monthly
  starting_odometer: number;
  current_odometer: number | null;
  overage_cost_per_mile: string;
  monthly_payment: string | null;
  dealer_name: string | null;
  dealer_phone: string | null;
  contract_number: string | null;
  notes: string | null;
  is_active: boolean;
  role?: 'owner' | 'editor' | 'viewer'; // only present in list response
  created_at: string;
  updated_at: string;
};

// LeaseSummary — matches backend ILeaseSummary
// Note: pace_status === 'ahead' means driving more miles than budgeted (was isOverPace === true)
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

// OdometerReading — matches backend IOdometerReading
export type OdometerReading = {
  id: string;
  lease_id: string;
  user_id: string;
  odometer: number;
  reading_date: string;
  notes: string | null;
  source: string;
  created_at: string;
};

// SavedTrip — matches backend ISavedTrip
export type SavedTrip = {
  id: string;
  lease_id: string;
  user_id: string;
  name: string;
  estimated_miles: number;
  trip_date: string | null;
  notes: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

// AlertConfig — generic per-type model matching backend IAlertConfig
// The backend stores 3 rows per lease, one per alert_type.
export type AlertConfig = {
  id: string;
  lease_id: string;
  user_id: string;
  alert_type: 'miles_threshold' | 'over_pace' | 'days_remaining';
  threshold_value: number | null;
  is_enabled: boolean;
  last_sent_at: string | null;
  created_at: string;
};

// LeaseMember — matches backend ILeaseMemberWithUser
export type LeaseMember = {
  id: string;
  lease_id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  invited_by: string | null;
  accepted_at: string | null;
  display_name: string | null;
  email: string;
  created_at: string;
};

// User — matches GET /api/users/me response
// There is NO first_name or last_name — only display_name.
export type User = {
  id: string;
  email: string;
  display_name: string | null;
  subscription_tier: string;
  subscription_expires_at: string | null;
};

// SubscriptionStatus — matches GET /api/subscriptions/status response
export type SubscriptionStatus = {
  is_active: boolean;
  expires_at: string | null;
  product_id: string | null;
  platform: string | null;
};

// MileageHistoryEntry — matches backend IMileageHistoryEntry
// Returned as a flat array from GET /api/leases/:id/mileage-history.
// miles_driven is the delta for that month, NOT a cumulative odometer reading.
export type MileageHistoryEntry = {
  month: string;          // format: 'YYYY-MM'
  miles_driven: number;   // miles driven during that month
  expected_miles: number; // expected miles for that month (miles_per_year / 12)
};

// ─── Input Types (match backend Zod schemas) ────────────────────────────────

export type CreateLeaseInput = {
  display_name: string;
  make?: string;
  model?: string;
  year?: number;
  trim?: string;
  color?: string;
  vin?: string;
  license_plate?: string;
  lease_start_date: string;
  lease_end_date: string;
  total_miles_allowed: number;
  miles_per_year: number;
  starting_odometer?: number;
  current_odometer?: number;
  overage_cost_per_mile: number;
  monthly_payment?: number;
  dealer_name?: string;
  dealer_phone?: string;
  contract_number?: string;
  notes?: string;
  is_active?: boolean;
};

export type UpdateLeaseInput = Partial<CreateLeaseInput>;

export type PaginationParams = {
  limit?: number;
  before?: string; // ISO date string cursor
};

export type CreateReadingInput = {
  odometer: number;
  reading_date: string;
  notes?: string;
  source?: string;
};

export type UpdateReadingInput = {
  odometer?: number;
  reading_date?: string;
  notes?: string | null;
  source?: string;
};

export type CreateTripInput = {
  name: string;            // required by backend
  estimated_miles: number;
  trip_date?: string;
  notes?: string;
  is_completed?: boolean;
};

export type UpdateTripInput = {
  name?: string;
  estimated_miles?: number;
  trip_date?: string;
  notes?: string;
  is_completed?: boolean;
};

export type UpdateAlertConfigInput = {
  threshold_value?: number | null;
  is_enabled?: boolean;
};

export type InviteMemberInput = {
  email: string;
  role?: 'viewer' | 'editor';
};

export type UpdateUserInput = {
  display_name?: string | null;
  push_token?: string | null;
};

export type VerifyAppleInput = {
  receipt_data: string;
  product_id: string;
};

export type VerifyGoogleInput = {
  purchase_token: string;
  product_id: string;
};
