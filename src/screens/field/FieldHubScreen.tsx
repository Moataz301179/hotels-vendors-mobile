/**
 * HOVIN Field — Hub
 *
 * Home screen for the "field layer" (dispatcher / supplier on the ground).
 * Surfaces a live incoming-order pulse plus one-tap access to the four field
 * modules:
 *
 *   1. Live Order Inbox   — real-time inbound POs with one-tap status shifts
 *   2. Dock Scanner (GRN) — barcode scan → GRN + auto credit-note
 *   3. Logistics & GPS    — routing, live tracking, POD capture
 *   4. 48h Cash-Out       — early payout on approved orders (reverse factoring)
 *
 * The header hero pulls a lightweight live-order count from the field API so
 * the dispatcher sees pressure at a glance; degrades gracefully to demo mode.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from "react-native";
import {
  Radio, ScanLine, Navigation, Wallet, ChevronRight, WifiOff, RefreshCw,
} from "lucide-react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { fieldAPI } from "@/api";

interface HubModule {
  key: string;
  title: string;
  subtitle: string;
  icon: typeof Radio;
  route: string;
  accent: string;
}

const MODULES: HubModule[] = [
  {
    key: "inbox", title: "Live Order Inbox",
    subtitle: "Real-time POs · one-tap status", icon: Radio,
    route: "FieldLiveOrders", accent: colors.info,
  },
  {
    key: "dock", title: "Dock Scanner",
    subtitle: "Scan barcode → GRN + credit note", icon: ScanLine,
    route: "FieldDockScanner", accent: colors.primary,
  },
  {
    key: "logistics", title: "Logistics & GPS",
    subtitle: "Routing · tracking · POD", icon: Navigation,
    route: "FieldLogistics", accent: "#D4AF37",
  },
  {
    key: "cashout", title: "48h Cash-Out",
    subtitle: "Early payout on approved orders", icon: Wallet,
    route: "FieldCashOut", accent: colors.success,
  },
];

export default function FieldHubScreen({ navigation }: any) {
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPulse = useCallback(async () => {
    try {
      const { data } = await fieldAPI.liveOrders({ limit: "1" });
      if (data.success && data.data) {
        setLiveCount(data.data.total ?? data.data.count ?? null);
        setDemoMode(false);
      } else {
        setDemoMode(true);
        setLiveCount(null);
      }
    } catch {
      setDemoMode(true);
      setLiveCount(null);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPulse(); }, [fetchPulse]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPulse(); }} tintColor={colors.primary} />
      }
    >
      {/* Hero pulse */}
      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroEyebrow}>HOVIN FIELD</Text>
            <Text style={styles.heroTitle}>Dock &amp; Dispatch</Text>
          </View>
          <View style={styles.pulseBadge}>
            <RefreshCw size={13} color={colors.primary} />
            <Text style={styles.pulseBadgeText}>Pulse</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.pulseCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("FieldLiveOrders")}
        >
          <View style={styles.pulseIcon}><Radio size={22} color={colors.info} /></View>
          <View style={styles.pulseInfo}>
            <Text style={styles.pulseNumber}>
              {liveCount === null ? "—" : liveCount}
            </Text>
            <Text style={styles.pulseLabel}>live orders awaiting action</Text>
          </View>
        </TouchableOpacity>

        {demoMode ? (
          <View style={styles.demoBanner}>
            <WifiOff size={14} color={colors.warning} />
            <Text style={styles.demoBannerText}>Offline — pulse cannot reach the backend.</Text>
          </View>
        ) : null}
      </View>

      {/* Module grid */}
      <Text style={styles.sectionTitle}>Field Tools</Text>
      <View style={styles.grid}>
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <TouchableOpacity
              key={m.key}
              style={styles.module}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(m.route)}
            >
              <View style={[styles.moduleIcon, { backgroundColor: m.accent + "1e" }]}>
                <Icon size={22} color={m.accent} />
              </View>
              <Text style={styles.moduleTitle}>{m.title}</Text>
              <Text style={styles.moduleSub}>{m.subtitle}</Text>
              <View style={styles.moduleFooter}>
                <Text style={styles.moduleOpen}>Open</Text>
                <ChevronRight size={15} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 100, gap: spacing.lg, backgroundColor: colors.bg, flexGrow: 1 },
  hero: { gap: spacing.md },
  heroHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroEyebrow: { ...typography.label, color: colors.textMuted, letterSpacing: 2 },
  heroTitle: { ...typography.h1, color: colors.text, marginTop: 4 },
  pulseBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.primary + "16", paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.full },
  pulseBadgeText: { ...typography.caption, color: colors.primary, fontWeight: "600", textTransform: "uppercase" },
  pulseCard: { flexDirection: "row", alignItems: "center", gap: spacing.lg, backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  pulseIcon: { width: 48, height: 48, borderRadius: radii.md, backgroundColor: colors.info + "1e", alignItems: "center", justifyContent: "center" },
  pulseInfo: { flex: 1 },
  pulseNumber: { ...typography.h1, color: colors.info, fontWeight: "700", fontVariant: ["tabular-nums"] },
  pulseLabel: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  demoBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.warning + "18", padding: spacing.sm, borderRadius: radii.md },
  demoBannerText: { ...typography.caption, color: colors.warning, flex: 1 },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  module: {
    width: "47%", flexGrow: 1, backgroundColor: colors.bgCard, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.sm,
  },
  moduleIcon: { width: 42, height: 42, borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
  moduleTitle: { ...typography.body, color: colors.text, fontWeight: "700" },
  moduleSub: { ...typography.caption, color: colors.textMuted, lineHeight: 15 },
  moduleFooter: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: spacing.xs },
  moduleOpen: { ...typography.caption, color: colors.primary, fontWeight: "600" },
});
