import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APPEARANCE_STORAGE_KEY = '@appearance_mode';

export type AppearanceMode = 'light' | 'dark' | 'system';

type AppearanceState = {
  mode: AppearanceMode;
  isHydrated: boolean;
  setMode: (mode: AppearanceMode) => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useAppearanceStore = create<AppearanceState>((set) => ({
  mode: 'system',
  isHydrated: false,

  setMode: async (mode: AppearanceMode) => {
    set({ mode });
    await AsyncStorage.setItem(APPEARANCE_STORAGE_KEY, mode);
  },

  hydrate: async () => {
    const stored = await AsyncStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      set({ mode: stored, isHydrated: true });
    } else {
      set({ isHydrated: true });
    }
  },
}));
