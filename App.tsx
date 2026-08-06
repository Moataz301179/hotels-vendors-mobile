/**
 * HotelsVendors Mobile — Entry Point
 */

import React, { useEffect, useState, useCallback } from "react";
import { View } from "react-native";
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
import { initializeNotifications } from "@/services/notifications";
import { colors } from "@/theme";
import SplashScreen from "@/screens/onboarding/SplashScreen";
import OnboardingScreen from "@/screens/onboarding/OnboardingScreen";
import { hasOnboarded, markOnboardingSeen } from "@/utils/onboarding";
import AppNavigator from "@/navigation/AppNavigator";

enableScreens();

type Phase = "splash" | "onboarding" | "app";

export default function App() {
  const { restoreSession } = useAuthStore();
  const { loadFromStorage } = useNotificationStore();
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  const [phase, setPhase] = useState<Phase>("splash");

  useEffect(() => {
    restoreSession();
    loadFromStorage();
    if (phase === "app") {
      initializeNotifications();
    }
  }, [restoreSession, loadFromStorage, phase]);

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

  if (phase === "onboarding") {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <OnboardingScreen onDone={handleOnboardingDone} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
