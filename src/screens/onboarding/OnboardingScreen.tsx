/**
 * Onboarding — opening message + scrolling-tips carousel
 * Dribbble-style: full-bleed imagery, parallax, animated pagination dots.
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import type { SharedValue } from "react-native-reanimated";
import { colors, typography, spacing, radii } from "@/theme";

const { width: SCREEN_W } = Dimensions.get("window");

const SLIDES = [
  {
    image: require("../../../assets/images/onboarding-1.jpg"),
    kicker: "Procurement",
    title: "Buy smarter for your property",
    tip: "Send one quote request — compare offers from verified vendors without phone calls.",
  },
  {
    image: require("../../../assets/images/onboarding-2.jpg"),
    kicker: "Vendors",
    title: "Source faster, nationwide",
    tip: "Browse the catalog, shortlist suppliers, and get competitive quotes on every order.",
  },
  {
    image: require("../../../assets/images/onboarding-3.jpg"),
    kicker: "Payments",
    title: "Pay, track, and stay compliant",
    tip: "ETA-compliant invoices, negotiated credit, and delivery tracking from order to receipt.",
  },
];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const scrollX = useSharedValue(0);
  const [index, setIndex] = React.useState(0);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W));
  };

  const last = index === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumEnd}
      >
        {SLIDES.map((s, i) => (
          <Slide key={i} slide={s} scrollX={scrollX} index={i} />
        ))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Dot key={i} index={i} scrollX={scrollX} />
          ))}
        </View>

        {last ? (
          <TouchableOpacity style={styles.cta} onPress={onDone}>
            <Text style={styles.ctaText}>Get Started</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onDone}>
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function Slide({ slide, scrollX, index }: { slide: (typeof SLIDES)[0]; scrollX: SharedValue<number>; index: number }) {
  const imgStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(scrollX.value, [SCREEN_W * (index - 1), SCREEN_W * index, SCREEN_W * (index + 1)], [1.15, 1.0, 1.15], Extrapolation.CLAMP) },
      { translateX: interpolate(scrollX.value, [SCREEN_W * (index - 1), SCREEN_W * index, SCREEN_W * (index + 1)], [-30, 0, 30], Extrapolation.CLAMP) },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, [SCREEN_W * (index - 1), SCREEN_W * index, SCREEN_W * (index + 1)], [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollX.value, [SCREEN_W * (index - 1), SCREEN_W * index, SCREEN_W * (index + 1)], [24, 0, -24], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <View style={styles.slide}>
      <Animated.Image source={slide.image} style={[styles.image, imgStyle]} />
      <View style={styles.overlay} />
      <Animated.View style={[styles.textBlock, textStyle]}>
        <Text style={styles.kicker}>{slide.kicker}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.tip}>{slide.tip}</Text>
      </Animated.View>
    </View>
  );
}

function Dot({ index, scrollX }: { index: number; scrollX: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    width: interpolate(scrollX.value, [SCREEN_W * (index - 1), SCREEN_W * index, SCREEN_W * (index + 1)], [8, 26, 8], Extrapolation.CLAMP),
    opacity: interpolate(scrollX.value, [SCREEN_W * (index - 1), SCREEN_W * index, SCREEN_W * (index + 1)], [0.35, 1, 0.35], Extrapolation.CLAMP),
  }));
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  slide: { width: SCREEN_W, flex: 1 },
  image: { width: SCREEN_W, height: "100%", position: "absolute" },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(11,13,18,0.55)",
  },
  textBlock: { flex: 1, justifyContent: "flex-end", padding: spacing.xl, paddingBottom: spacing.xxxl },
  kicker: { ...typography.label, color: "#FFFFFF", letterSpacing: 2, textTransform: "uppercase", marginBottom: spacing.sm },
  title: { ...typography.h1, color: "#FFFFFF", fontSize: 30, lineHeight: 38, marginBottom: spacing.md },
  tip: { ...typography.body, color: "rgba(255,255,255,0.78)", lineHeight: 24 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    backgroundColor: "transparent",
  },
  dots: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.xl },
  dot: { height: 8, borderRadius: 999, backgroundColor: "#FFFFFF" },
  skip: { ...typography.body, color: "rgba(255,255,255,0.85)", textAlign: "center", paddingVertical: spacing.md },
  cta: {
    backgroundColor: "#FFFFFF",
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: "center",
  },
  ctaText: { color: colors.bg, fontWeight: "700", fontSize: 16, fontFamily: "PlusJakartaSans_700Bold" },
});
