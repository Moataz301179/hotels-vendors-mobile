/**
 * Splash Screen — animated 3D-feel monogram + initialization steps
 * Dribbble-style dark institutional loading intro (HOVIN identity).
 */

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { colors, typography, spacing, radii } from "@/theme";

const INIT_STEPS = [
  "Initializing secure session",
  "Loading vendor network",
  "Preparing your catalog",
  "Ready",
];

const STEP_MS = 700;

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const glow = useSharedValue(0.35);
  const [step, setStep] = useState(0);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    glow.value = withRepeat(withTiming(0.85, { duration: 1300, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setStep(Math.min(i, INIT_STEPS.length - 1));
      setPct(Math.min(100, Math.round((i / INIT_STEPS.length) * 100)));
      if (i >= INIT_STEPS.length) {
        clearInterval(iv);
        setTimeout(onDone, 500);
      }
    }, STEP_MS);
    return () => clearInterval(iv);
  }, [onDone]);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glow, glowStyle]} />

      <Image
        source={require("../../../assets/brand/hovin-logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.subline}>Digital Procurement Hub</Text>
      <Text style={styles.byline}>A Hotels Vendors application</Text>

      <View style={styles.stepRow}>
        <Text style={styles.step}>{INIT_STEPS[step]}</Text>
        <Text style={styles.pct}>{pct}%</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  glow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: "rgba(171,162,148,0.14)",
    top: "26%",
  },
  logo: {
    width: 170,
    aspectRatio: 769 / 415,
    resizeMode: "contain",
    marginBottom: spacing.xxl,
  },
  subline: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  byline: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm, letterSpacing: 0.4 },
  stepRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xxxl,
  },
  step: { ...typography.bodySmall, color: colors.textSecondary },
  pct: { ...typography.bodySmall, color: colors.text, fontFamily: "PlusJakartaSans_600SemiBold" },
  barTrack: {
    width: "100%",
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.bgCard,
    marginTop: spacing.md,
    overflow: "hidden",
  },
  barFill: {
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
  },
});
