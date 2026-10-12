/**
 * Theme Hook
 * Resolves the effective color scheme from the user's stored preference
 * (light / dark / system) combined with the device/system color scheme.
 */

import { useSettingsStore } from "@/store/settings";

type EffectiveScheme = "light" | "dark";

export function useTheme(): {
  colorMode: "light" | "dark" | "system";
  effectiveScheme: EffectiveScheme;
  isDark: boolean;
} {
  const colorMode = useSettingsStore((s) => s.colorMode);
  // The current product contract is light-only. Retain the setting shape for
  // persisted compatibility, but never let a device preference switch to the
  // retired dark surface.
  return { colorMode: "light", effectiveScheme: "light", isDark: false };
}
