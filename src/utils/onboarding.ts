/**
 * Onboarding first-launch flag (AsyncStorage)
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "hv_onboarding_seen";

export async function hasOnboarded(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v === "1";
  } catch {
    return false;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, "1");
  } catch {}
}
