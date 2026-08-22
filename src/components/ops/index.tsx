/**
 * HOVIN Ops Console — non-generic industrial design kit
 * Design language: Industrial Skeuomorphism (chassis panels, LED status,
 * mono readouts, mechanical press buttons). Applied on top of the locked
 * dark join-palette tokens. Zero gradients, zero glassmorphism.
 */
import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Platform, Pressable,
} from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence,
  Easing,
} from "react-native-reanimated";
import { colors, spacing, radii } from "@/theme";

/** System mono for readouts (no new dependency — platform fonts). */
export const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

/** Micro-label: uppercase + letterspaced (the "label plate" look). */
export function Plate({ children, tone = colors.gold, style }: { children: React.ReactNode; tone?: string; style?: any }) {
  return (
    <Text style={[styles.plate, { color: tone }, style]}>{children}</Text>
  );
}

/** Chassis panel — 1px structural border, solid raised surface, optional FIG tag. */
export function Panel({ children, tag, style }: { children: React.ReactNode; tag?: string; style?: any }) {
  return (
    <View style={[styles.panel, style]}>
      <View style={styles.panelTop}>
        <View style={styles.panelSlot} />
        {tag ? <Text style={styles.panelTag}>{tag}</Text> : null}
      </View>
      {children}
    </View>
  );
}

/** Status LED with pulse animation. */
export function Led({ on = true, color = colors.gold, size = 10 }: { on?: boolean; color?: string; size?: number }) {
  const pulse = useSharedValue(1);
  React.useEffect(() => {
    if (on) {
      pulse.value = withRepeat(withSequence(
        withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ), -1);
    } else {
      pulse.value = 0.25;
    }
  }, [on]);
  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return (
    <Animated.View
      style={[{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color,
        borderWidth: 2, borderColor: "rgba(0,0,0,0.45)",
      }, style]}
    />
  );
}

/** Mono readout — big figure + caption. */
export function Readout({ value, caption, tone = colors.text, captionColor }: {
  value: string | number; caption?: string;
  tone?: string; captionColor?: string;
}) {
  return (
    <View style={styles.readoutWrap}>
      <Text style={[styles.readout, { color: tone, fontFamily: MONO }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {caption ? <Text style={[styles.readoutCap, { color: captionColor || colors.textMuted }]}>{caption}</Text> : null}
    </View>
  );
}

/** Mechanical press button — translateY + compressed shadow on press. */
export function MechButton({ children, onPress, tone = colors.primary, style, small }: {
  children: React.ReactNode; onPress?: () => void;
  tone?: string; style?: any; small?: boolean;
}) {
  const y = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Pressable
      onPressIn={() => { y.value = withTiming(2, { duration: 70 }); }}
      onPressOut={() => { y.value = withTiming(0, { duration: 120 }); }}
      onPress={onPress}
    >
      <Animated.View
        style={[styles.mechBtn, small && styles.mechBtnSmall, { backgroundColor: tone }, { boxShadow: `0 4px 0 ${colors.primaryDark}` }, anim, style]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

/** Segmented tabs — hard active fill. */
export function SegTabs({ tabs, active, onChange }: {
  tabs: string[]; active: number; onChange: (i: number) => void;
}) {
  return (
    <View style={styles.segRow}>
      {tabs.map((t, i) => (
        <TouchableOpacity
          key={t}
          onPress={() => onChange(i)}
          style={[styles.segBtn, i === active && { backgroundColor: colors.primary }]}
          activeOpacity={0.9}
        >
          <Text style={[styles.segText, { fontFamily: MONO }, i === active && { color: colors.bg }]}>
            {t.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/** Status pill — mono, bordered, tone-colored. */
export function StatusPill({ label, tone = colors.success }: { label: string; tone?: string }) {
  return (
    <View style={[styles.pill, { borderColor: tone + "99" }]}>
      <Text style={[styles.pillText, { color: tone, fontFamily: MONO }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

/** Ventilation-slot divider. */
export function SlotDivider() {
  return <View style={styles.slotDivider} />;
}

/** Top signal bar — LED + mono status strip for screens. */
export function SignalBar({ items }: { items: { label: string; on?: boolean; tone?: string }[] }) {
  return (
    <View style={styles.signalBar}>
      {items.map((it) => (
        <View key={it.label} style={styles.signalItem}>
          <Led on={it.on !== false} color={it.tone || (it.on === false ? colors.error : colors.green)} size={8} />
          <Text style={[styles.signalText, { fontFamily: MONO }]}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  plate: { fontSize: 10, fontWeight: "800", letterSpacing: 1.8, textTransform: "uppercase" },
  panel: {
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: radii.md - 2,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  panelTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  panelSlot: { height: 4, width: 34, backgroundColor: colors.primary, borderRadius: 2 },
  panelTag: { fontFamily: MONO, fontSize: 9, color: colors.textMuted, letterSpacing: 1.4 },
  readoutWrap: { marginTop: spacing.sm },
  readout: { fontSize: 30, fontWeight: "700", letterSpacing: -0.5 },
  readoutCap: { fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", marginTop: 3, fontWeight: "600" },
  mechBtn: {
    borderRadius: radii.sm - 2,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  mechBtnSmall: { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md },
  segRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: radii.sm - 2,
    overflow: "hidden",
    backgroundColor: colors.bgDeep,
  },
  segBtn: { flex: 1, paddingVertical: spacing.sm + 3, alignItems: "center" },
  segText: { fontSize: 10.5, fontWeight: "700", letterSpacing: 1, color: colors.textMuted },
  pill: {
    borderWidth: 1,
    borderRadius: radii.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: "flex-start",
  },
  pillText: { fontSize: 9.5, fontWeight: "700", letterSpacing: 1 },
  slotDivider: {
    height: 5,
    flexDirection: "row",
    overflow: "hidden",
    marginVertical: spacing.md,
  },
  signalBar: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: radii.sm - 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgDeep,
    gap: spacing.lg,
    flexWrap: "wrap",
  },
  signalItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  signalText: { fontSize: 9, color: colors.textSecondary, letterSpacing: 1 },
});

/** Extra space for the slot divider's inner slots (composed of alternating lines). */
export function SlotDividerRows() {
  return (
    <View style={[styles.slotDivider, { flexDirection: "row", gap: 3 }]}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={{ flex: 1, height: 5, backgroundColor: i % 2 === 0 ? colors.borderLight : "transparent", borderRadius: 2 }} />
      ))}
    </View>
  );
}
