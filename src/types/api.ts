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
  userId: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  vehicleTrim?: string;
  startDate: string;
  endDate: string;
  totalMiles: number;
  startingMileage: number;
  currentMileage: number;
  monthlyMiles: number;
  createdAt: string;
  updatedAt: string;
};

export type LeaseSummary = {
  leaseId: string;
  vehicleLabel: string;
  startDate: string;
  endDate: string;
  totalMiles: number;
  milesUsed: number;
  milesRemaining: number;
  daysRemaining: number;
  projectedMiles: number;
  isOverPace: boolean;
};

export type OdometerReading = {
  id: string;
  leaseId: string;
  mileage: number;
  readingDate: string;
  note?: string;
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
  createdAt: string;
  updatedAt: string;
};

export type LeaseMember = {
  id: string;
  leaseId: string;
  userId: string;
  email: string;
  role: 'owner' | 'viewer';
  createdAt: string;
};

export type SubscriptionStatus = {
  isPremium: boolean;
  tier: 'free' | 'premium';
  expiresAt: string | null;
  platform: 'ios' | 'android' | null;
  productId: string | null;
};

export type MileageHistoryEntry = {
  date: string;
  mileage: number;
  projectedMileage: number;
};

export type MileageHistory = {
  leaseId: string;
  entries: MileageHistoryEntry[];
};

export type CreateLeaseInput = {
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  vehicleTrim?: string;
  startDate: string;
  endDate: string;
  totalMiles: number;
  startingMileage: number;
  monthlyMiles: number;
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
  >
>;

export type UpdateUserInput = Partial<Pick<User, 'firstName' | 'lastName'>>;
