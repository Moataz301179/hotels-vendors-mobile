/**
 * HOVIN Field — Live Order Inbox
 *
 * Real-time incoming Purchase-Order (PO) feed for the dispatcher/supplier on
 * the ground. Polls the field API on an interval (lightweight "live" push
 * without a socket dependency), renders POs newest-first, and lets the user
 * shift each PO through its field lifecycle with a single tap:
 *
 *     READY  →  IN_TRANSIT  →  DELIVERED
 *
 * Status shifts are optimistic (instant UI) and reconciled with the server;
 * on failure the local state is reverted. If the backend is not yet reachable
 * the screen degrades gracefully to a clearly-labelled demo feed so the field
 * UX can be exercised offline.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
  Alert, ActivityIndicator,
} from "react-native";
import {
  Radio, MapPin, PackageCheck, Clock, Package, Zap, WifiOff, Truck,
} from "lucide-react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { fieldAPI } from "@/api";
import { fmtMoney, fmtDate } from "@/utils/format";

type FieldStatus = "READY" | "IN_TRANSIT" | "DELIVERED";

/** Field lifecycle order — used to render the one-tap status stepper. */
const FIELD_STEPS: FieldStatus[] = ["READY", "IN_TRANSIT", "DELIVERED"];

const STATUS_META: Record<
  FieldStatus,
  { label: string; color: string; icon: typeof Radio }
> = {
  READY: { label: "Ready", color: "#3B82F6", icon: Package },
  IN_TRANSIT: { label: "In Transit", color: "#D4AF37", icon: Truck },
  DELIVERED: { label: "Delivered", color: "#22C55E", icon: PackageCheck },
};

interface LiveOrder {
  id: string;
  orderNumber: string;
  poNumber?: string | null;
  status: FieldStatus;
  totalAmount: number;
  currency: string;
  createdAt: string;
  deliveryDate?: string | null;
  hotelName?: string;
  hotelCity?: string | null;
  itemCount: number;
  dock?: string | null;
}

/** Demo feed used only when the field API is unreachable (marked in the UI). */
const DEMO_ORDERS: LiveOrder[] = [
  {
    id: "demo-1", orderNumber: "PO-10234", poNumber: "HV-8841",
    status: "READY", totalAmount: 18400, currency: "EGP",
    createdAt: new Date().toISOString(), deliveryDate: new Date(Date.now() + 86400000).toISOString(),
    hotelName: "Grand Nile Tower", hotelCity: "Cairo", itemCount: 12, dock: "Dock A",
  },
  {
    id: "demo-2", orderNumber: "PO-10235", poNumber: "HV-8842",
    status: "IN_TRANSIT", totalAmount: 6200, currency: "EGP",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    deliveryDate: new Date(Date.now() + 7200000).toISOString(),
    hotelName: "Sofitel Winter Palace", hotelCity: "Luxor", itemCount: 6, dock: "Dock B",
  },
  {
    id: "demo-3", orderNumber: "PO-10236", poNumber: "HV-8843",
    status: "DELIVERED", totalAmount: 9400, currency: "EGP",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    deliveryDate: new Date(Date.now() - 3600000).toISOString(),
    hotelName: "Marriott Mena House", hotelCity: "Giza", itemCount: 9, dock: "Dock A",
  },
];

export default function LiveOrderInboxScreen({ navigation }: any) {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyFeed = useCallback((list: LiveOrder[]) => {
    // Newest first; stable ordering so optimistic updates don't jump rows.
    setOrders([...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
    setLoading(false);
  }, []);

  const fetchLive = useCallback(
    async (silent = false) => {
      try {
        const { data } = await fieldAPI.liveOrders();
        if (data.success && data.data) {
          applyFeed(data.data.orders ?? data.data);
          setDemoMode(false);
        } else {
          setDemoMode(true);
          if (!silent) applyFeed(DEMO_ORDERS);
        }
      } catch {
        // Backend not reachable — degrade to a clearly-labelled demo feed.
        setDemoMode(true);
        if (!silent) applyFeed(DEMO_ORDERS);
      } finally {
        setRefreshing(false);
      }
    },
    [applyFeed]
  );

  // Initial load + lightweight polling for the "live" feed.
  useEffect(() => {
    fetchLive();
    pollRef.current = setInterval(() => fetchLive(true), 12000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchLive]);

  /** Optimistic one-tap status shift, reconciled with the server. */
  const shiftStatus = async (order: LiveOrder, next: FieldStatus) => {
    if (order.status === next) return;

    const previous = orders;
    setOrders((cur) =>
      cur.map((o) => (o.id === order.id ? { ...o, status: next } : o))
    );

    try {
      await fieldAPI.shiftStatus(order.id, next);
    } catch {
      // Revert on failure.
      setOrders(previous);
      Alert.alert(
        "Update failed",
        "Could not shift this order's status right now. Showing the last confirmed state."
      );
    }
  };

  const renderItem = ({ item }: { item: LiveOrder }) => {
    const idx = FIELD_STEPS.indexOf(item.status);
    const meta = STATUS_META[item.status];
    const Icon = meta.icon;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => navigation.navigate("OrderDetail", { id: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNum}>{item.orderNumber}</Text>
            {item.poNumber ? (
              <Text style={styles.muted}>PO: {item.poNumber}</Text>
            ) : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: meta.color + "22" }]}>
            <Icon size={12} color={meta.color} />
            <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <MapPin size={15} color={colors.textMuted} />
            <Text style={styles.infoText}>
              {item.hotelName || "Hotel"}{item.hotelCity ? ` · ${item.hotelCity}` : ""}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Package size={15} color={colors.textMuted} />
            <Text style={styles.infoText}>{item.itemCount} line item(s)</Text>
            {item.dock ? (
              <>
                <Clock size={15} color={colors.textMuted} style={{ marginLeft: spacing.md }} />
                <Text style={styles.infoText}>{item.dock}</Text>
              </>
            ) : null}
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.amount}>{fmtMoney(item.totalAmount)}</Text>
          <Text style={styles.due}>{item.deliveryDate ? `Due ${fmtDate(item.deliveryDate)}` : ""}</Text>
        </View>

        {/* One-tap status stepper */}
        <View style={styles.stepper}>
          {FIELD_STEPS.map((step, i) => {
            const active = i <= idx;
            const stepMeta = STATUS_META[step];
            const isCurrent = i === idx;
            return (
              <React.Fragment key={step}>
                {i > 0 && (
                  <View style={[styles.stepperLine, active ? styles.stepperLineActive : null]} />
                )}
                <TouchableOpacity
                  style={[
                    styles.step,
                    active && { borderColor: stepMeta.color },
                    isCurrent && { backgroundColor: stepMeta.color + "1e" },
                  ]}
                  disabled={i < idx}
                  onPress={() => shiftStatus(item, step)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.stepText,
                      active ? { color: stepMeta.color } : { color: colors.textMuted },
                      isCurrent && { fontWeight: "700" },
                    ]}
                  >
                    {stepMeta.label}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.centerText}>Loading live orders…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {demoMode ? (
        <View style={styles.demoBanner}>
          <WifiOff size={14} color={colors.warning} />
          <Text style={styles.demoBannerText}>
            Offline demo feed — backend not reachable. Showing sample POs.
          </Text>
        </View>
      ) : (
        <View style={styles.liveBanner}>
          <Zap size={14} color={colors.success} />
          <Text style={styles.liveBannerText}>Live · refreshing every 12s</Text>
        </View>
      )}

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchLive(false);
            }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Radio size={48} color={colors.textMuted} />
            <Text style={styles.empty}>No live orders right now</Text>
            <Text style={styles.emptySub}>Incoming purchase orders will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, gap: spacing.md },
  centerText: { ...typography.body, color: colors.textMuted },
  demoBanner: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.warning + "18", paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  demoBannerText: { ...typography.caption, color: colors.warning, flex: 1 },
  liveBanner: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.success + "18", paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  liveBannerText: { ...typography.caption, color: colors.success, flex: 1 },
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.lg, gap: spacing.md,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderInfo: { flex: 1, marginRight: spacing.md },
  orderNum: { ...typography.h3, color: colors.text },
  muted: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.full,
  },
  badgeText: { ...typography.caption, textTransform: "uppercase", fontWeight: "600" },
  cardBody: { gap: spacing.xs },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  infoText: { ...typography.bodySmall, color: colors.textSecondary },
  cardFooter: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border,
  },
  amount: { ...typography.body, color: colors.primary, fontWeight: "700" },
  due: { ...typography.caption, color: colors.textMuted },
  stepper: { flexDirection: "row", alignItems: "center", marginTop: spacing.sm },
  stepperLine: { flex: 1, height: 2, backgroundColor: colors.border, marginHorizontal: spacing.xs },
  stepperLineActive: { backgroundColor: colors.primary },
  step: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.full,
    paddingHorizontal: spacing.md, paddingVertical: 6,
  },
  stepText: { ...typography.caption, fontWeight: "600", textTransform: "uppercase" },
  emptyContainer: { alignItems: "center", paddingVertical: spacing.xxxl * 2, gap: spacing.md },
  empty: { ...typography.body, color: colors.textMuted, textAlign: "center" },
  emptySub: { ...typography.caption, color: colors.textSecondary, textAlign: "center" },
});
