/**
 * Theme Hook
 * Resolves the effective color scheme from the user's stored preference
 * (light / dark / system) combined with the device/system color scheme.
 */

import { useSyncExternalStore } from "react";
import { Appearance } from "react-native";
import { useSettingsStore } from "@/store/settings";

type EffectiveScheme = "light" | "dark";

function getAppearanceSnapshot() {
  return Appearance.getColorScheme();
}

function appearanceListener(cb: () => void) {
  const sub = Appearance.addChangeListener(cb);
  return () => sub?.remove?.();
}

export function useTheme(): {
  colorMode: "light" | "dark" | "system";
  effectiveScheme: EffectiveScheme;
  isDark: boolean;
} {
  const colorMode = useSettingsStore((s) => s.colorMode);
  const systemScheme = useSyncExternalStore(
    appearanceListener,
    getAppearanceSnapshot,
    getAppearanceSnapshot
  );

  const resolvedSystem: EffectiveScheme = systemScheme === "dark" ? "dark" : "light";
  const effectiveScheme: EffectiveScheme =
    colorMode === "system" ? resolvedSystem : colorMode;

  return { colorMode, effectiveScheme, isDark: effectiveScheme === "dark" };
}
