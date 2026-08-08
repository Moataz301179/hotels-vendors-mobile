/**
 * Settings Store — Zustand
 * Persisted user preferences: color scheme (light / dark / system).
 */

import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ColorMode = "light" | "dark" | "system";

export const COLOR_MODE_STORAGE_KEY = "invoh_settings_colorMode";
export const DEFAULT_COLOR_MODE: ColorMode = "system";

interface SettingsState {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  hydrate: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  colorMode: DEFAULT_COLOR_MODE,
  setColorMode: (mode) => {
    set({ colorMode: mode });
    AsyncStorage.setItem(COLOR_MODE_STORAGE_KEY, mode).catch(() => {});
  },
  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(COLOR_MODE_STORAGE_KEY);
      const valid = stored === "light" || stored === "dark" || stored === "system";
      if (valid) {
        set({ colorMode: stored as ColorMode });
      } else {
        set({ colorMode: DEFAULT_COLOR_MODE });
      }
    } catch {
      set({ colorMode: DEFAULT_COLOR_MODE });
    }
  },
}));
