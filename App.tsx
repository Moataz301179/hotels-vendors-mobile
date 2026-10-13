/**
 * HotelsVendors Mobile — Entry Point
 */

import React, { useEffect, useState, useCallback } from "react";
import { LogBox, View } from "react-native";
import { ClerkProvider } from "@clerk/expo";
import { useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import * as NativeSplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useAuthStore } from "@/store/auth";
import { useNotificationStore } from "@/store/notifications";
import { useSettingsStore } from "@/store/settings";
import { useTheme } from "@/hooks/useTheme";
import { initializeNotifications } from "@/services/notifications";
import { colors } from "@/theme";
import SplashScreen from "@/screens/onboarding/SplashScreen";
import OnboardingScreen from "@/screens/onboarding/OnboardingScreen";
import { hasOnboarded, markOnboardingSeen } from "@/utils/onboarding";
import AppNavigator from "@/navigation/AppNavigator";
import { setClerkTokenGetter } from "@/api/clerk-token";

enableScreens();

type Phase = "splash" | "onboarding" | "app";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Expo Notifications probes the push keychain even on iOS Simulator, where
// the entitlement is intentionally unavailable. It is safe to ignore this
// simulator-only diagnostic; push registration is already skipped by the
// notification service when `Device.isDevice` is false.
LogBox.ignoreLogs(["[expo-notifications] Error reading persisted server registration info"]);
void NativeSplashScreen.hideAsync();

if (!publishableKey) {
  throw new Error("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is required");
}

function AppContent() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { loadFromStorage } = useNotificationStore();
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const { isDark } = useTheme();
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  const [phase, setPhase] = useState<Phase>("splash");

  useEffect(() => {
    setClerkTokenGetter(() => getToken());
    return () => setClerkTokenGetter(null);
  }, [getToken]);

  useEffect(() => {
    void useAuthStore.getState().syncClerkSession(isLoaded, Boolean(isSignedIn));
    void loadFromStorage();
    void hydrateSettings();
  }, [hydrateSettings, isLoaded, isSignedIn, loadFromStorage]);

  useEffect(() => {
    if (phase === "app") void initializeNotifications();
  }, [phase]);

  const handleSplashDone = useCallback(async () => {
    const seen = await hasOnboarded();
    setPhase(seen ? "app" : "onboarding");
  }, []);

  const handleOnboardingDone = useCallback(async () => {
    await markOnboardingSeen();
    setPhase("app");
  }, []);

  if (!fontsLoaded || phase === "splash") {
    return (
      <SafeAreaProvider>
        <SplashScreen onDone={handleSplashDone} />
      </SafeAreaProvider>
    );
  }

  const rootBg = isDark ? colors.bg : colors.bgLight;
  const statusBarStyle = isDark ? "light" : "dark";

  if (phase === "onboarding") {
    return (
      <SafeAreaProvider>
        <StatusBar style={statusBarStyle} />
        <View style={{ flex: 1, backgroundColor: rootBg }}>
          <OnboardingScreen onDone={handleOnboardingDone} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={statusBarStyle} />
      <View style={{ flex: 1, backgroundColor: rootBg }}>
        <AppNavigator />
      </View>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <AppContent />
    </ClerkProvider>
  );
}
