import { create } from 'zustand';
import type { Lease } from '../types/api';

type LeasesState = {
  leases: Lease[];
  overPaceCount: number;
  activeLeaseId: string | null;
  setLeases: (leases: Lease[]) => void;
  setOverPaceCount: (count: number) => void;
  setActiveLeaseId: (id: string | null) => void;
};

export const useLeasesStore = create<LeasesState>(set => ({
  leases: [],
  overPaceCount: 0,
  activeLeaseId: null,
  setLeases: (leases: Lease[]) => set({ leases }),
  setOverPaceCount: (count: number) => set({ overPaceCount: count }),
  setActiveLeaseId: (id: string | null) => set({ activeLeaseId: id }),
}));
