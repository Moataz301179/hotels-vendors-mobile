/**
 * HotelsVendors Mobile — Entry Point
 */

import React, { useEffect, useState, useCallback } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useAuthStore } from "@/store/auth";
import { colors } from "@/theme";
import SplashScreen from "@/screens/onboarding/SplashScreen";
import OnboardingScreen from "@/screens/onboarding/OnboardingScreen";
import { hasOnboarded, markOnboardingSeen } from "@/utils/onboarding";
import AppNavigator from "@/navigation/AppNavigator";

type Phase = "splash" | "onboarding" | "app";

export default function App() {
  const { restoreSession } = useAuthStore();
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  const [phase, setPhase] = useState<Phase>("splash");

  useEffect(() => {
    restoreSession();
  }, []);

  const handleSplashDone = useCallback(async () => {
    const seen = await hasOnboarded();
    setPhase(seen ? "app" : "onboarding");
  }, []);

  const handleOnboardingDone = useCallback(async () => {
    await markOnboardingSeen();
    setPhase("app");
  }, []);

  if (!fontsLoaded || phase === "splash") {
    return <SplashScreen onDone={handleSplashDone} />;
  }

  if (phase === "onboarding") {
    return (
      <>
        <StatusBar style="light" />
        <OnboardingScreen onDone={handleOnboardingDone} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}
