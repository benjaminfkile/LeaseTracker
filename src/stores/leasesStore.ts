import { create } from 'zustand';
import type { Lease } from '../types/api';

export type { Lease } from '../types/api';

type LeasesState = {
  leases: Lease[];
  overPaceCount: number;
  setLeases: (leases: Lease[]) => void;
  setOverPaceCount: (count: number) => void;
};

export const useLeasesStore = create<LeasesState>(set => ({
  leases: [],
  overPaceCount: 0,
  setLeases: (leases: Lease[]) => set({ leases }),
  setOverPaceCount: (count: number) => set({ overPaceCount: count }),
}));
