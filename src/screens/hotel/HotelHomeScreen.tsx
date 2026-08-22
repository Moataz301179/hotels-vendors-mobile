/**
 * Hotel Home Screen — Premium 2026 Buyer Dashboard
 *
 * Real data only. Sources:
 *   GET /api/v1/hotel/spend   → year, records, totalSpend, totalOrders, byCategory
 *   GET /api/v1/hotel/orders  → orders[].status/.total/.supplier, pagination
 *
 * No fabricated numbers: every figure derives from those two endpoints,
 * or renders an honest empty state.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
  Dimensions, ActivityIndicator,
} from "react-native";
import {
  ShoppingBasket, ClipboardList, FileText, FilePlus2,
} from "lucide-react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { useAuthStore } from "@/store/auth";
import { hotelAPI } from "@/api";
import { orderStatusColor, orderStatusLabel, fmtMoney, fmtDate, greeting } from "@/utils/format";
import { CategoryGridSection } from "@/components/CategoryGrid";
import {
  Panel, Readout, MechButton, StatusPill, Plate, Led, SignalBar,
  SlotDividerRows, MONO,
} from "@/components/ops";

// ─── Types ────────────────────────────────────────────

interface SpendRecord {
  id: string;
  category: string;
  month: number;
  amount: string | number;
  orderCount: number;
}

interface SpendData {
  year: number;
  records: SpendRecord[];
  totalSpend: number;
  totalOrders: number;
  byCategory: Record<string, { amount: number; orderCount: number }>;
}

interface HotelOrder {
  id: string;
  orderNumber?: string;
  status?: string;
  total?: number | string;
  currency?: string;
  createdAt?: string;
  deliveryDate?: string | null;
  supplier?: { id?: string; name?: string } | null;
}

interface HotelOrdersData {
  orders: HotelOrder[];
  pagination?: { page?: number; limit?: number; total?: number; totalPages?: number };
}

// ─── Constants ────────────────────────────────────────

/** Orders not yet delivered — the "pending" pipeline. */
const PENDING_STATUSES = new Set([
  "PENDING_APPROVAL", "APPROVED", "CONFIRMED", "IN_TRANSIT",
]);

const BAR_COLORS = [
  colors.accent,
  colors.info,
  colors.success,
  colors.warning,
  colors.error,
  "#8B5CF6",
];

const SCREEN_WIDTH = Dimensions.get("window").width;
// Bar chart: card padding both sides + label column
const CHART_LABEL_WIDTH = 90;
const CHART_BAR_AREA_WIDTH = SCREEN_WIDTH - spacing.lg * 2 - CHART_LABEL_WIDTH - spacing.md;

// ─── Helpers ─────────────────────────────────────────

function computeMonthlySpend(records: SpendRecord[]): number {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  return records
    .filter((r) => r.month === currentMonth)
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);
}

function topCategories(
  byCategory: Record<string, { amount: number; orderCount: number }>,
  max = 5,
): { category: string; amount: number; orderCount: number }[] {
  return Object.entries(byCategory)
    .map(([category, v]) => ({ category, amount: v.amount, orderCount: v.orderCount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, max);
}

// ─── Component ───────────────────────────────────────

export default function HotelHomeScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const [spend, setSpend] = useState<SpendData | null>(null);
  const [orders, setOrders] = useState<HotelOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [spendRes, ordersRes] = await Promise.all([
        hotelAPI.spend(),
        hotelAPI.orders({ limit: "10" }),
      ]);
      if (spendRes.data?.success && spendRes.data?.data) {
        setSpend(spendRes.data.data as SpendData);
      }
      if (ordersRes.data?.success && ordersRes.data?.data) {
        setOrders((ordersRes.data.data as HotelOrdersData).orders ?? []);
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

  const monthlySpend = spend ? computeMonthlySpend(spend.records) : 0;
  const totalSpend = spend?.totalSpend ?? 0;

  const pendingCount = orders.filter((o) => o.status && PENDING_STATUSES.has(o.status)).length;
  const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;
  const activeSuppliers = new Set(
    orders.map((o) => o.supplier?.id).filter(Boolean) as string[],
  ).size;

  const cats = spend ? topCategories(spend.byCategory) : [];
  const maxAmount = cats.length > 0 ? Math.max(...cats.map((c) => c.amount), 1) : 1;

  const recentOrders = orders.slice(0, 3);

  const quickActions = [
    { label: "Browse Catalog", icon: ShoppingBasket, screen: "CatalogTab", color: colors.accent },
    { label: "My Orders", icon: ClipboardList, screen: "OrdersTab", color: colors.info },
    { label: "Invoices", icon: FileText, screen: "InvoicesTab", color: colors.warning },
    { label: "New RFQ", icon: FilePlus2, screen: "CatalogTab", color: colors.success },
  ];

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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Plate tone={colors.textMuted}>Ops Console</Plate>
          <Text style={styles.name}>{user?.name || "Hotel"}</Text>
          {user?.companyName ? (
            <Text style={styles.company}>{user.companyName}</Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <SignalBar
        items={[
          { label: "API LINK" },
          { label: "ETA BRIDGE", tone: colors.green },
          { label: orders.length + " ORDERS" },
        ]}
      />

      <Panel tag="FIG-01 - SPEND" style={{ marginTop: spacing.md }}>
        <View style={ops.heroRow}>
          <Led color={colors.gold} />
          <Plate style={{ marginLeft: spacing.sm }}>Monthly Spend</Plate>
        </View>
        <Readout value={fmtMoney(monthlySpend)} caption={"YTD " + fmtMoney(totalSpend)} />
      </Panel>

      <View style={styles.kpiRow}>
        <Panel tag="PIPE" style={{ flex: 1, marginBottom: 0, padding: spacing.md }}>
          <View style={ops.miniKpiTop}><Led color={colors.warning} size={6} /><Text style={ops.miniKpiCap}>PENDING</Text></View>
          <Text style={[ops.miniKpiVal, { color: colors.warning, fontFamily: MONO }]}>{pendingCount}</Text>
        </Panel>
        <Panel tag="OK" style={{ flex: 1, marginBottom: 0, padding: spacing.md }}>
          <View style={ops.miniKpiTop}><Led color={colors.success} size={6} /><Text style={ops.miniKpiCap}>DELIVERED</Text></View>
          <Text style={[ops.miniKpiVal, { color: colors.success, fontFamily: MONO }]}>{deliveredCount}</Text>
        </Panel>
        <Panel tag="SRC" style={{ flex: 1, marginBottom: 0, padding: spacing.md }}>
          <View style={ops.miniKpiTop}><Led color={colors.info} size={6} /><Text style={ops.miniKpiCap}>SUPPLIERS</Text></View>
          <Text style={[ops.miniKpiVal, { color: colors.info, fontFamily: MONO }]}>{activeSuppliers}</Text>
        </Panel>
      </View>

      <Plate style={{ marginBottom: spacing.sm }}>Commands</Plate>
      <SlotDividerRows />
      <View style={styles.actionsGrid}>
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <MechButton key={action.label} onPress={() => navigation.navigate(action.screen)}>
              <View style={ops.actionRow}>
                <Icon size={15} color={colors.bg} />
                <Text style={ops.actionLabelDark}>{action.label}</Text>
              </View>
            </MechButton>
          );
        })}
      </View>

      <View style={styles.sectionHeader}>
        <Plate>Recent Orders</Plate>
        <TouchableOpacity onPress={() => navigation.navigate("OrdersTab")}>
          <Text style={styles.seeAll}>View all</Text>
        </TouchableOpacity>
      </View>
      {recentOrders.length === 0 ? (
        <Panel tag="EMPTY">
          <Text style={styles.emptyText}>No orders yet</Text>
          <Text style={styles.emptySubtext}>Browse the catalog to place your first order</Text>
        </Panel>
      ) : (
        recentOrders.map((o) => (
          <TouchableOpacity
            key={o.id}
            onPress={() => navigation.navigate("OrderDetail", { id: o.id })}
            activeOpacity={0.85}
          >
            <Panel tag={o.status ? orderStatusLabel(o.status).toUpperCase() : "PO"}>
              <View style={styles.orderHeader}>
                <Text style={[styles.orderNumber, { fontFamily: MONO }]}>{o.orderNumber || "-"}</Text>
                {o.status ? <StatusPill label={orderStatusLabel(o.status)} tone={orderStatusColor(o.status)} /> : null}
              </View>
              <Text style={styles.orderSupplier}>{o.supplier?.name || "Supplier"}</Text>
              <View style={styles.orderFooter}>
                <Text style={[styles.orderAmount, { fontFamily: MONO }]}>{fmtMoney(Number(o.total || 0))}</Text>
                <Text style={styles.orderDate}>{fmtDate(o.deliveryDate || o.createdAt)}</Text>
              </View>
            </Panel>
          </TouchableOpacity>
        ))
      )}

      <View style={styles.sectionHeader}>
        <Plate>Spend by Category</Plate>
      </View>
      {cats.length === 0 ? (
        <Panel tag="NO DATA">
          <Text style={styles.emptyText}>No spend data yet</Text>
          <Text style={styles.emptySubtext}>Category breakdown appears after your first orders</Text>
        </Panel>
      ) : (
        <Panel tag="FIG-02 - ALLOC">
          {cats.map((c, i) => {
            const barWidth = Math.max((c.amount / maxAmount) * CHART_BAR_AREA_WIDTH, 4);
            return (
              <View key={c.category} style={styles.chartRow}>
                <Text style={styles.chartLabel} numberOfLines={1}>{c.category}</Text>
                <View style={styles.chartBarTrack}>
                  <View style={[styles.chartBar, { width: barWidth, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }]} />
                </View>
                <Text style={[styles.chartAmount, { fontFamily: MONO }]}>{fmtMoney(c.amount)}</Text>
              </View>
            );
          })}
        </Panel>
      )}

      <View style={styles.categorySection}>
        <CategoryGridSection
          title="Browse by Category"
          onCategoryPress={(category) => navigation.navigate("CatalogTab", { category: category.slug })}
        />
      </View>
    </ScrollView>
  );
}

const ops = StyleSheet.create({
  heroRow: { flexDirection: "row", alignItems: "center", marginBottom: spacing.xs },
  miniKpiTop: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: spacing.sm },
  miniKpiCap: { fontSize: 9, letterSpacing: 1.2, color: colors.textMuted, fontWeight: "700" },
  miniKpiVal: { fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionLabelDark: { color: colors.bg, fontSize: 12.5, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl * 4 },

  loadingWrap: {
    flex: 1, backgroundColor: colors.bg,
    justifyContent: "center", alignItems: "center",
  },

  // Header
  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: spacing.xl,
  },
  greeting: {
    ...typography.caption, color: colors.textMuted,
    textTransform: "uppercase", letterSpacing: 1,
  },
  name: { ...typography.h1, color: colors.text, marginTop: spacing.xs },
  company: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  logoutBtn: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radii.full, backgroundColor: colors.error + "20",
  },
  logoutText: { color: colors.error, ...typography.label },

  // Hero KPI
  heroKpi: {
    backgroundColor: colors.bgCard, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl, marginBottom: spacing.md,
  },
  heroTop: {
    flexDirection: "row", alignItems: "center",
    marginBottom: spacing.md,
  },
  heroIconWrap: {
    width: 44, height: 44, borderRadius: radii.md,
    backgroundColor: colors.accentMuted,
    alignItems: "center", justifyContent: "center",
    marginRight: spacing.md,
  },
  heroLabelWrap: { flex: 1 },
  heroLabel: {
    ...typography.label, color: colors.textMuted,
    letterSpacing: 0.8,
  },
  heroSubLabel: {
    ...typography.caption, color: colors.textSecondary,
    marginTop: 2,
  },
  heroValue: {
    ...typography.h1, color: colors.text,
    fontSize: 32, fontWeight: "700",
  },

  // KPI Row
  kpiRow: {
    flexDirection: "row", gap: spacing.md,
    marginBottom: spacing.xl,
  },
  kpiCard: {
    flex: 1, backgroundColor: colors.bgCard,
    borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, alignItems: "center",
  },
  kpiIconWrap: {
    width: 32, height: 32, borderRadius: radii.sm,
    alignItems: "center", justifyContent: "center",
    marginBottom: spacing.sm,
  },
  kpiValue: {
    ...typography.h2, fontSize: 20, fontWeight: "700",
  },
  kpiLabel: {
    ...typography.caption, color: colors.textMuted,
    marginTop: spacing.xs, textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  // Section labels
  sectionLabel: {
    ...typography.label, color: colors.textSecondary,
    marginBottom: spacing.sm, letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  seeAll: {
    ...typography.caption, color: colors.primary, fontWeight: "600",
  },

  // Quick Actions Grid
  actionsGrid: {
    flexDirection: "row", flexWrap: "wrap",
    gap: spacing.md, marginBottom: spacing.md,
  },
  actionCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2,
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.bgCard, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, marginBottom: 0,
  },
  actionIconWrap: {
    width: 40, height: 40, borderRadius: radii.md,
    alignItems: "center", justifyContent: "center",
    marginRight: spacing.md,
  },
  actionLabel: {
    ...typography.body, color: colors.text,
    fontWeight: "600", flex: 1,
  },

  // Order Cards
  orderCard: {
    backgroundColor: colors.bgCard, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  orderHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: spacing.xs,
  },
  orderNumber: {
    ...typography.h3, color: colors.text,
    fontWeight: "700", flex: 1,
  },
  badge: {
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: radii.full,
  },
  badgeText: {
    ...typography.label, fontSize: 10,
    textTransform: "uppercase",
  },
  orderSupplier: {
    ...typography.bodySmall, color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  orderFooter: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginTop: spacing.md,
  },
  orderAmount: {
    ...typography.body, color: colors.primary,
    fontWeight: "700",
  },
  orderDate: {
    ...typography.caption, color: colors.textMuted,
  },

  // Mini Chart
  chartCard: {
    backgroundColor: colors.bgCard, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  chartRow: {
    flexDirection: "row", alignItems: "center",
    marginBottom: spacing.md,
  },
  chartLabel: {
    ...typography.caption, color: colors.textSecondary,
    width: CHART_LABEL_WIDTH,
    fontSize: 12,
  },
  chartBarTrack: {
    flex: 1, height: 12,
    backgroundColor: colors.bgInput,
    borderRadius: radii.sm, marginRight: spacing.md,
    overflow: "hidden",
  },
  chartBar: {
    height: "100%", borderRadius: radii.sm,
  },
  chartAmount: {
    ...typography.caption, color: colors.text,
    fontWeight: "600", width: 75, textAlign: "right",
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

  // Category section
  categorySection: {
    marginTop: spacing.md,
  },
});
