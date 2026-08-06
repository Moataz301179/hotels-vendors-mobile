/**
 * Supplier Dashboard — KPIs, recent orders, low stock, recent GRNs
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { supplierAPI } from "@/api";
import { useAuthStore } from "@/store/auth";
import { greeting, orderStatusColor, orderStatusLabel, fmtMoney, fmtDate } from "@/utils/format";
import { LayoutDashboard, ClipboardList, Package, BarChart3, ClipboardCheck, AlertTriangle } from "lucide-react-native";
import type { SupplierKpis, RecentOrder, RecentGrn } from "@/types";

interface DashboardData {
  kpis: SupplierKpis;
  recentOrders: RecentOrder[];
  recentGrns: RecentGrn[];
  lowStock: { id: string; name: string; sku: string; stockQuantity: number; unitOfMeasure: string }[];
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

export default function SupplierDashboardScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const { data: res } = await supplierAPI.dashboard();
      if (res.success && res.data) setData(res.data);
    } catch {} finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const k = data.kpis;

  const quickActions = [
    { label: "Catalog", icon: Package, onPress: () => navigation.navigate("CatalogTab") },
    { label: "Orders", icon: ClipboardList, onPress: () => navigation.navigate("OrdersTab") },
    { label: "Finance", icon: BarChart3, onPress: () => navigation.navigate("FinanceTab") },
    { label: "GRN", icon: ClipboardCheck, onPress: () => navigation.navigate("SupplierGrn") },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
    >
      <View style={styles.hero}>
        <Text style={styles.greeting}>{greeting()}</Text>
        <Text style={styles.userName}>{user?.name || "Supplier"}</Text>
        {user?.companyName || user?.supplier?.name ? (
          <Text style={styles.company}>{user?.companyName || user?.supplier?.name}</Text>
        ) : null}
      </View>

      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { flex: 1.3 }]}>
          <View style={styles.kpiHeader}>
            <BarChart3 size={18} color={colors.primary} />
            <Text style={[styles.kpiValue, { color: colors.primary }]}>{fmtMoney(k.totalRevenue)}</Text>
          </View>
          <Text style={styles.kpiLabel}>Revenue</Text>
        </View>
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <ClipboardList size={18} color={colors.textMuted} />
            <Text style={styles.kpiValue}>{k.totalOrders}</Text>
          </View>
          <Text style={styles.kpiLabel}>Orders</Text>
        </View>
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <AlertTriangle size={18} color={colors.pending} />
            <Text style={[styles.kpiValue, { color: colors.pending }]}>{k.pendingOrders}</Text>
          </View>
          <Text style={styles.kpiLabel}>Pending</Text>
        </View>
      </View>

      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Package size={18} color="#D4AF37" />
            <Text style={[styles.kpiValue, { color: "#D4AF37" }]}>{k.inTransitOrders}</Text>
          </View>
          <Text style={styles.kpiLabel}>In Transit</Text>
        </View>
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <ClipboardCheck size={18} color={colors.success} />
            <Text style={[styles.kpiValue, { color: colors.success }]}>{k.deliveredOrders}</Text>
          </View>
          <Text style={styles.kpiLabel}>Delivered</Text>
        </View>
        <View style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <AlertTriangle size={18} color={k.lowStockCount > 0 ? colors.error : colors.success} />
            <Text style={[styles.kpiValue, { color: k.lowStockCount > 0 ? colors.error : colors.success }]}>{k.lowStockCount}</Text>
          </View>
          <Text style={styles.kpiLabel}>Low Stock</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        {quickActions.map((a) => {
          const Icon = a.icon;
          return (
            <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={a.onPress}>
              <Icon size={20} color={colors.primary} />
              <Text style={styles.actionText}>{a.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        <TouchableOpacity onPress={() => navigation.navigate("OrdersTab")}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      {data.recentOrders.length === 0 ? (
        <Text style={styles.empty}>No orders from hotels yet</Text>
      ) : (
        data.recentOrders.map((o) => (
          <TouchableOpacity key={o.id} style={styles.card} onPress={() => navigation.navigate("OrderDetail", { id: o.id })}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderNum}>{o.orderNumber}</Text>
              <View style={[styles.badge, { backgroundColor: orderStatusColor(o.status) + "22" }]}>
                <Text style={[styles.badgeText, { color: orderStatusColor(o.status) }]}>{orderStatusLabel(o.status)}</Text>
              </View>
            </View>
            {o.poNumber ? <Text style={styles.muted}>PO: {o.poNumber}</Text> : null}
            <Text style={styles.hotel}>{o.hotelName || "Hotel"}{o.hotelCity ? ` · ${o.hotelCity}` : ""}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.amount}>{fmtMoney(o.total)}</Text>
              <Text style={styles.muted}>{fmtDate(o.deliveryDate || o.createdAt)}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      {data.lowStock.length > 0 ? (
        <>
          <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.error }]}>Low Stock Alert</Text>
        {data.lowStock.length > 0 ? (
          <TouchableOpacity onPress={() => navigation.navigate("CatalogTab")}>
            <Text style={styles.seeAll}>Fix now</Text>
          </TouchableOpacity>
        ) : null}
      </View>
          {data.lowStock.map((p) => (
            <View key={p.id} style={[styles.card, { borderColor: colors.error + "55" }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderNum}>{p.name}</Text>
                <Text style={[styles.badgeText, { color: colors.error }]}>{p.stockQuantity} {p.unitOfMeasure}</Text>
              </View>
              <Text style={styles.muted}>SKU: {p.sku}</Text>
            </View>
          ))}
        </>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Goods Received (GRN)</Text>
        {data.recentGrns.length > 0 ? (
          <TouchableOpacity onPress={() => navigation.navigate("SupplierGrn")}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {data.recentGrns.length === 0 ? (
        <Text style={styles.empty}>No goods received notes yet</Text>
      ) : (
        data.recentGrns.map((g) => (
          <View key={g.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderNum}>{g.grnNumber}</Text>
              <View style={[styles.badge, { backgroundColor: orderStatusColor(g.status) + "22" }]}>
                <Text style={[styles.badgeText, { color: orderStatusColor(g.status) }]}>{orderStatusLabel(g.status)}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  hero: { marginBottom: spacing.lg },
  greeting: { ...typography.caption, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1 },
  userName: { ...typography.h2, color: colors.text, marginTop: spacing.xs },
  company: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  kpiRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
  kpiCard: { flex: 1, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.lg },
  kpiHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs },
  kpiValue: { ...typography.h2, color: colors.text, fontWeight: "600" },
  kpiLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  actionsRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.lg },
  actionBtn: {
    flex: 1, backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primary + "44",
    borderRadius: radii.md, paddingVertical: spacing.md, alignItems: "center",
  },
  actionText: { ...typography.label, color: colors.primary, textTransform: "uppercase", letterSpacing: 0.5 },
  sectionTitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm, marginTop: spacing.md, textTransform: "uppercase", letterSpacing: 0.6 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  seeAll: { ...typography.caption, color: colors.primary, fontWeight: "600" },
  card: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderNum: { ...typography.h3, color: colors.text, flex: 1 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.full },
  badgeText: { ...typography.label, textTransform: "uppercase" },
  hotel: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md },
  amount: { ...typography.body, color: colors.primary, fontWeight: "600" },
  muted: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  empty: { ...typography.body, color: colors.textMuted, textAlign: "center", marginTop: spacing.lg, marginBottom: spacing.md },
});
