/**
 * Supplier Dashboard — Premium 2026 Fulfillment Dashboard
 *
 * Real data only. Sources:
 *   GET /api/v1/supplier/dashboard → kpis, recentOrders, recentGrns, lowStock
 *   GET /api/v1/oliv/kyc-status     → facility, onboarding (48h factoring)
 *
 * No fabricated numbers: every figure derives from those endpoints,
 * or renders an honest empty state.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
  Dimensions, ActivityIndicator,
} from "react-native";
import {
  ClipboardList, AlertTriangle, BarChart3, Wallet,
  ClipboardCheck, Package, Upload, Banknote, ScanLine,
  Zap, Lock, ChevronRight, TrendingUp,
} from "lucide-react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { supplierAPI, olivAPI } from "@/api";
import { useAuthStore } from "@/store/auth";
import { greeting, orderStatusColor, orderStatusLabel, fmtMoney, fmtDate } from "@/utils/format";
import type { SupplierKpis, RecentOrder, RecentGrn } from "@/types";

// ─── Types ────────────────────────────────────────────

interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  unitOfMeasure: string;
}

interface DashboardData {
  kpis: SupplierKpis;
  recentOrders: RecentOrder[];
  recentGrns: RecentGrn[];
  lowStock: LowStockItem[];
}

interface OlivFacility {
  id?: string;
  status?: string;
  approvedAt?: string;
  expiresAt?: string;
  lastSyncedAt?: string;
  creditLimitEgp?: number;
  availableEgp?: number;
}

interface OlivKycData {
  hasOnboarding: boolean;
  status: string;
  hasCompletedKyc: boolean;
  canProceed: boolean;
  supplier?: { id: string; name: string; taxId?: string | null; olivStatus?: string | null } | null;
  facility?: OlivFacility | null;
  onboarding?: Record<string, unknown> | null;
}

const EMPTY: DashboardData = {
  kpis: {
    totalOrders: 0, pendingOrders: 0, approvedOrders: 0, inTransitOrders: 0,
    deliveredOrders: 0, totalRevenue: 0, productsCount: 0, lowStockCount: 0,
  },
  recentOrders: [],
  recentGrns: [],
  lowStock: [],
};

const SCREEN_WIDTH = Dimensions.get("window").width;

// ─── Component ────────────────────────────────────────

export default function SupplierDashboardScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [oliv, setOliv] = useState<OlivKycData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, kycRes] = await Promise.allSettled([
        supplierAPI.dashboard(),
        olivAPI.getKycStatus(),
      ]);

      if (dashRes.status === "fulfilled" && dashRes.value.data?.success && dashRes.value.data?.data) {
        setData(dashRes.value.data.data as DashboardData);
      }
      if (kycRes.status === "fulfilled" && kycRes.value.data?.success && kycRes.value.data?.data) {
        setOliv(kycRes.value.data.data as OlivKycData);
      }
    } catch {
      // Silent — empty states will render
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const k = data.kpis;
  const fundsAvailable = oliv?.facility?.availableEgp;
  const factoringActive = oliv?.canProceed && oliv?.facility?.status === "ACTIVE";

  const quickActions = [
    { label: "Accept Orders", icon: ClipboardList, screen: "OrdersTab", color: colors.info },
    { label: "Upload Catalog", icon: Upload, screen: "CatalogTab", color: colors.accent },
    { label: "Cash Out", icon: Banknote, screen: "FinanceTab", color: colors.success },
    { label: "GRN Scan", icon: ScanLine, screen: "SupplierGrn", color: colors.warning },
  ];

  const ordersToFulfill = data.recentOrders
    .filter((o) => o.status === "PENDING_APPROVAL" || o.status === "APPROVED" || o.status === "CONFIRMED")
    .slice(0, 3);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // ─── Loading ─────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ─── Render ──────────────────────────────────────

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* ─── Header ─── */}
      <View style={styles.hero}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.userName}>{user?.name || "Supplier"}</Text>
          {user?.companyName || user?.supplier?.name ? (
            <Text style={styles.company}>
              {user?.companyName || user?.supplier?.name}
            </Text>
          ) : null}
        </View>
      </View>

      {/* ─── KPI Row: Pending · Low Stock · Revenue · Funds ─── */}
      <View style={styles.kpiRow}>
        <KpiCard
          icon={<ClipboardList size={16} color={colors.warning} />}
          value={k.pendingOrders}
          label="Pending"
          tone={colors.warning}
        />
        <KpiCard
          icon={<AlertTriangle size={16} color={k.lowStockCount > 0 ? colors.error : colors.success} />}
          value={k.lowStockCount}
          label="Low Stock"
          tone={k.lowStockCount > 0 ? colors.error : colors.success}
        />
      </View>

      <View style={styles.kpiRow}>
        <KpiCard
          icon={<TrendingUp size={16} color={colors.primary} />}
          value={fmtMoney(k.totalRevenue)}
          label="Revenue"
          tone={colors.primary}
          wide
        />
        <KpiCard
          icon={<Wallet size={16} color={factoringActive ? colors.success : colors.textMuted} />}
          value={factoringActive && fundsAvailable != null ? fmtMoney(fundsAvailable) : "—"}
          label="Funds Available"
          tone={factoringActive ? colors.success : colors.textMuted}
          wide
        />
      </View>

      {/* ─── 48h Factoring Status Card ─── */}
      <FactoringCard oliv={oliv} navigation={navigation} />

      {/* ─── Quick Actions ─── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
      </View>
      <View style={styles.actionsGrid}>
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              onPress={() => navigation.navigate(action.screen)}
              activeOpacity={0.85}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: action.color + "1A" }]}>
                <Icon size={22} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ─── Orders to Fulfill ─── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>ORDERS TO FULFILL</Text>
        <TouchableOpacity onPress={() => navigation.navigate("OrdersTab")}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      {ordersToFulfill.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No orders to fulfill</Text>
          <Text style={styles.emptySubtext}>New orders from hotels will appear here</Text>
        </View>
      ) : (
        ordersToFulfill.map((o) => (
          <TouchableOpacity
            key={o.id}
            style={styles.orderCard}
            onPress={() => navigation.navigate("OrderDetail", { id: o.id })}
            activeOpacity={0.85}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>{o.orderNumber}</Text>
              <View style={[styles.badge, { backgroundColor: orderStatusColor(o.status) + "22" }]}>
                <Text style={[styles.badgeText, { color: orderStatusColor(o.status) }]}>
                  {orderStatusLabel(o.status)}
                </Text>
              </View>
            </View>
            {o.poNumber ? <Text style={styles.muted}>PO: {o.poNumber}</Text> : null}
            <Text style={styles.hotel}>
              {o.hotelName || "Hotel"}{o.hotelCity ? ` · ${o.hotelCity}` : ""}
            </Text>
            <View style={styles.orderFooter}>
              <Text style={styles.orderAmount}>{fmtMoney(o.total)}</Text>
              <Text style={styles.muted}>{fmtDate(o.deliveryDate || o.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* ─── Low Stock Alerts ─── */}
      {data.lowStock.length > 0 ? (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.error }]}>LOW STOCK ALERT</Text>
            <TouchableOpacity onPress={() => navigation.navigate("CatalogTab")}>
              <Text style={styles.seeAll}>Fix now</Text>
            </TouchableOpacity>
          </View>
          {data.lowStock.slice(0, 5).map((p) => (
            <View key={p.id} style={[styles.lowStockCard, { borderColor: colors.error + "55" }]}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderNumber} numberOfLines={1}>{p.name}</Text>
                <Text style={[styles.badgeText, { color: colors.error }]}>
                  {p.stockQuantity} {p.unitOfMeasure}
                </Text>
              </View>
              <Text style={styles.muted}>SKU: {p.sku}</Text>
            </View>
          ))}
        </>
      ) : null}

      {/* ─── Recent GRNs ─── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>RECENT GRNS</Text>
        {data.recentGrns.length > 0 ? (
          <TouchableOpacity onPress={() => navigation.navigate("SupplierGrn")}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {data.recentGrns.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No goods received notes yet</Text>
        </View>
      ) : (
        data.recentGrns.slice(0, 3).map((g) => (
          <View key={g.id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>{g.grnNumber}</Text>
              <View style={[styles.badge, { backgroundColor: orderStatusColor(g.status) + "22" }]}>
                <Text style={[styles.badgeText, { color: orderStatusColor(g.status) }]}>
                  {orderStatusLabel(g.status)}
                </Text>
              </View>
            </View>
            {g.orderNumber ? <Text style={styles.muted}>Order: {g.orderNumber}</Text> : null}
            <Text style={styles.muted}>{fmtDate(g.receivedAt)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ─── KPI Card sub-component ────────────────────────────

function KpiCard({
  icon, value, label, tone, wide,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  tone: string;
  wide?: boolean;
}) {
  return (
    <View style={[styles.kpiCard, wide && styles.kpiCardWide]}>
      <View style={styles.kpiTop}>
        <View style={[styles.kpiIconWrap, { backgroundColor: tone + "1A" }]}>
          {icon}
        </View>
        <Text style={[styles.kpiValue, { color: tone }]}>{value}</Text>
      </View>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

// ─── 48h Factoring Card ───────────────────────────────

function FactoringCard({
  oliv, navigation,
}: {
  oliv: OlivKycData | null;
  navigation: any;
}) {
  // Not connected at all
  if (!oliv || (!oliv.hasOnboarding && !oliv.facility)) {
    return (
      <TouchableOpacity
        style={[styles.factoringCard, styles.factoringLocked]}
        onPress={() => navigation.navigate("FinanceTab")}
        activeOpacity={0.85}
      >
        <View style={styles.factoringLeft}>
          <View style={[styles.factoringIcon, { backgroundColor: colors.primaryMuted }]}>
            <Lock size={20} color={colors.primary} />
          </View>
          <View style={styles.factoringInfo}>
            <Text style={styles.factoringTitle}>48h Factoring</Text>
            <Text style={styles.factoringSub}>Connect to unlock instant invoice financing</Text>
          </View>
        </View>
        <ChevronRight size={20} color={colors.primary} />
      </TouchableOpacity>
    );
  }

  // Active facility
  if (oliv.canProceed && oliv.facility?.status === "ACTIVE") {
    const limit = oliv.facility.creditLimitEgp ?? 0;
    const available = oliv.facility.availableEgp ?? 0;
    const usedPct = limit > 0 ? ((limit - available) / limit) * 100 : 0;

    return (
      <TouchableOpacity
        style={[styles.factoringCard, styles.factoringActive]}
        onPress={() => navigation.navigate("FinanceTab")}
        activeOpacity={0.85}
      >
        <View style={styles.factoringLeft}>
          <View style={[styles.factoringIcon, { backgroundColor: colors.success + "1A" }]}>
            <Zap size={20} color={colors.success} />
          </View>
          <View style={styles.factoringInfo}>
            <View style={styles.factoringTitleRow}>
              <Text style={styles.factoringTitle}>48h Factoring</Text>
              <View style={[styles.factoringPill, { backgroundColor: colors.success + "22" }]}>
                <Text style={[styles.factoringPillText, { color: colors.success }]}>ACTIVE</Text>
              </View>
            </View>
            <Text style={styles.factoringSub}>
              {fmtMoney(available)} available · {fmtMoney(limit)} limit
            </Text>
            {limit > 0 ? (
              <View style={styles.factoringBarTrack}>
                <View
                  style={[styles.factoringBar, { width: `${Math.min(usedPct, 100)}%` }]}
                />
              </View>
            ) : null}
          </View>
        </View>
        <ChevronRight size={20} color={colors.success} />
      </TouchableOpacity>
    );
  }

  // Onboarding in progress
  const statusLabel = oliv.status === "PENDING" ? "Pending approval"
    : oliv.status === "ACTIVE" ? "Active"
    : oliv.hasCompletedKyc ? "KYC verified"
    : "In progress";

  return (
    <TouchableOpacity
      style={[styles.factoringCard, styles.factoringPending]}
      onPress={() => navigation.navigate("FinanceTab")}
      activeOpacity={0.85}
    >
      <View style={styles.factoringLeft}>
        <View style={[styles.factoringIcon, { backgroundColor: colors.warning + "1A" }]}>
          <Zap size={20} color={colors.warning} />
        </View>
        <View style={styles.factoringInfo}>
          <View style={styles.factoringTitleRow}>
            <Text style={styles.factoringTitle}>48h Factoring</Text>
            <View style={[styles.factoringPill, { backgroundColor: colors.warning + "22" }]}>
              <Text style={[styles.factoringPillText, { color: colors.warning }]}>
                {statusLabel.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.factoringSub}>
            Complete KYC to unlock instant invoice financing
          </Text>
        </View>
      </View>
      <ChevronRight size={20} color={colors.warning} />
    </TouchableOpacity>
  );
}

// ─── Styles ────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl * 2 },

  loadingWrap: {
    flex: 1, backgroundColor: colors.bg,
    justifyContent: "center", alignItems: "center",
  },

  // Header / Hero
  hero: { marginBottom: spacing.lg },
  greeting: {
    ...typography.caption, color: colors.textMuted,
    textTransform: "uppercase", letterSpacing: 1,
  },
  userName: { ...typography.h2, color: colors.text, marginTop: spacing.xs },
  company: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },

  // KPI Row
  kpiRow: {
    flexDirection: "row", gap: spacing.md,
    marginBottom: spacing.md,
  },
  kpiCard: {
    flex: 1, backgroundColor: colors.bgCard,
    borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md,
  },
  kpiCardWide: {
    alignItems: "stretch",
  },
  kpiTop: {
    flexDirection: "row", alignItems: "center",
    gap: spacing.sm, marginBottom: spacing.xs,
  },
  kpiIconWrap: {
    width: 32, height: 32, borderRadius: radii.sm,
    alignItems: "center", justifyContent: "center",
  },
  kpiValue: {
    ...typography.h2, fontSize: 20, fontWeight: "700",
    flexShrink: 1,
  },
  kpiLabel: {
    ...typography.caption, color: colors.textMuted,
    marginTop: spacing.xs, textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  // 48h Factoring Card
  factoringCard: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    borderRadius: radii.lg, borderWidth: 1,
    padding: spacing.lg, marginBottom: spacing.xl,
  },
  factoringLocked: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary + "44",
  },
  factoringActive: {
    backgroundColor: colors.success + "0D",
    borderColor: colors.success + "44",
  },
  factoringPending: {
    backgroundColor: colors.warning + "0D",
    borderColor: colors.warning + "44",
  },
  factoringLeft: {
    flexDirection: "row", alignItems: "center",
    flex: 1, paddingRight: spacing.md,
  },
  factoringIcon: {
    width: 44, height: 44, borderRadius: radii.md,
    alignItems: "center", justifyContent: "center",
    marginRight: spacing.md,
  },
  factoringInfo: { flex: 1 },
  factoringTitle: {
    ...typography.h3, color: colors.text,
    fontWeight: "700", fontSize: 16,
  },
  factoringTitleRow: {
    flexDirection: "row", alignItems: "center",
    gap: spacing.sm,
  },
  factoringPill: {
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: radii.full,
  },
  factoringPillText: {
    ...typography.label, fontSize: 9,
    letterSpacing: 0.5,
  },
  factoringSub: {
    ...typography.caption, color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  factoringBarTrack: {
    height: 4, backgroundColor: colors.bgInput,
    borderRadius: radii.full, marginTop: spacing.sm,
    overflow: "hidden",
  },
  factoringBar: {
    height: "100%", backgroundColor: colors.success,
    borderRadius: radii.full,
  },

  // Section labels
  sectionLabel: {
    ...typography.label, color: colors.textSecondary,
    letterSpacing: 0.8, textTransform: "uppercase",
  },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  seeAll: {
    ...typography.caption, color: colors.primary, fontWeight: "600",
  },

  // Quick Actions
  actionsGrid: {
    flexDirection: "row", flexWrap: "wrap",
    gap: spacing.md, marginBottom: spacing.md,
  },
  actionCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2,
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.bgCard, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md,
  },
  actionIconWrap: {
    width: 40, height: 40, borderRadius: radii.md,
    alignItems: "center", justifyContent: "center",
    marginRight: spacing.md,
  },
  actionLabel: {
    ...typography.body, color: colors.text,
    fontWeight: "600", flex: 1, fontSize: 14,
  },

  // Order / Low Stock Cards
  orderCard: {
    backgroundColor: colors.bgCard, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  lowStockCard: {
    backgroundColor: colors.bgCard, borderRadius: radii.lg,
    borderWidth: 1, padding: spacing.lg,
    marginBottom: spacing.md,
  },
  orderHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center",
  },
  orderNumber: {
    ...typography.h3, color: colors.text,
    fontWeight: "700", flex: 1, fontSize: 16,
  },
  badge: {
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: radii.full,
  },
  badgeText: {
    ...typography.label, fontSize: 10,
    textTransform: "uppercase",
  },
  hotel: {
    ...typography.bodySmall, color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  orderFooter: {
    flexDirection: "row", justifyContent: "space-between",
    marginTop: spacing.md,
  },
  orderAmount: {
    ...typography.body, color: colors.primary,
    fontWeight: "700",
  },
  muted: {
    ...typography.caption, color: colors.textMuted,
    marginTop: 2,
  },

  // Empty state
  emptyCard: {
    backgroundColor: colors.bgCard, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border,
    borderStyle: "dashed", padding: spacing.xl,
    alignItems: "center", marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body, color: colors.textSecondary,
    fontWeight: "600",
  },
  emptySubtext: {
    ...typography.caption, color: colors.textMuted,
    marginTop: spacing.xs, textAlign: "center",
  },
});
