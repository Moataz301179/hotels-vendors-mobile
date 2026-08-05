/**
 * Splash Screen — animated 3D-feel monogram + initialization steps
 * Dribbble-style dark institutional loading intro (Invo identity).
 */

import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
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
  const rotY = useSharedValue(0);
  const rotX = useSharedValue(-14);
  const glow = useSharedValue(0.35);
  const [step, setStep] = useState(0);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    rotY.value = withRepeat(withTiming(360, { duration: 2600, easing: Easing.linear }), -1);
    rotX.value = withSequence(
      withTiming(14, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      withTiming(-14, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      withTiming(0, { duration: 900, easing: Easing.inOut(Easing.sin) })
    );
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

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateY: `${rotY.value}deg` },
      { rotateX: `${rotX.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.glow, glowStyle]} />
      <Animated.View style={[styles.card, cardStyle]}>
        <Text style={styles.mono}>I</Text>
      </Animated.View>

      <Text style={styles.wordmark}>Invo</Text>
      <Text style={styles.subline}>Digital Procurement Hub</Text>

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
    backgroundColor: "rgba(255,255,255,0.06)",
    top: "28%",
  },
  card: {
    width: 104,
    height: 104,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FFFFFF",
    shadowOpacity: 0.25,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  mono: { ...typography.h1, color: "#0B0D12", fontSize: 52, fontFamily: "PlusJakartaSans_700Bold" },
  wordmark: { ...typography.h1, color: colors.text, marginTop: spacing.xxl },
  subline: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
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
    backgroundColor: "#FFFFFF",
  },
});
