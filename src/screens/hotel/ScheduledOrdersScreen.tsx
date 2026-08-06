/**
 * Scheduled Orders Screen — Recurring/repeat procurement management
 */

import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity,
} from "react-native";
import { CalendarClock, Play, Pause, Plus, Package, Clock, ArrowRight } from "lucide-react-native";
import { colors, spacing, radii, typography } from "@/theme";
import api from "@/api";

interface ScheduledOrder {
  id: string;
  name: string;
  frequency: string;
  nextRunAt: string;
  lastRunAt: string | null;
  status: string;
  autoSubmit: boolean;
  maxOrderValue: number | null;
  supplierName: string;
  itemCount: number;
  totalEstimate: number;
}

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  BI_WEEKLY: "Bi-Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  CUSTOM: "Custom",
};

export default function ScheduledOrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<ScheduledOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");

  const fetchOrders = async () => {
    try {
      const { data: res } = await api.get("/hotel/scheduled-orders");
      if (res.success) setOrders(res.data ?? []);
    } catch {} finally { setRefreshing(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      await api.patch(`/hotel/scheduled-orders/${id}`, { status: newStatus });
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: newStatus } : o));
    } catch {}
  };

  const filtered = orders.filter((o) => filter === "all" ? true : o.status === filter.toUpperCase());

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <CalendarClock size={20} color={colors.primary} />
        <Text style={styles.headerTitle}>Scheduled Orders</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Plus size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(["all", "active", "paused"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      {filtered.length ? filtered.map((order) => (
        <View key={order.id} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <View style={styles.orderInfo}>
              <Text style={styles.orderName}>{order.name}</Text>
              <Text style={styles.orderSupplier}>{order.supplierName}</Text>
            </View>
            <TouchableOpacity
              onPress={() => toggleStatus(order.id, order.status)}
              style={[styles.statusToggle, { backgroundColor: order.status === "ACTIVE" ? colors.success + "20" : colors.warning + "20" }]}
            >
              {order.status === "ACTIVE" ? (
                <Pause size={14} color={colors.success} />
              ) : (
                <Play size={14} color={colors.warning} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.orderDetails}>
            <View style={styles.detailItem}>
              <Clock size={12} color={colors.textMuted} />
              <Text style={styles.detailText}>{FREQUENCY_LABELS[order.frequency] ?? order.frequency}</Text>
            </View>
            <View style={styles.detailItem}>
              <Package size={12} color={colors.textMuted} />
              <Text style={styles.detailText}>{order.itemCount} items</Text>
            </View>
          </View>

          <View style={styles.orderFooter}>
            <View>
              <Text style={styles.footerLabel}>Next Run</Text>
              <Text style={styles.footerValue}>{new Date(order.nextRunAt).toLocaleDateString()}</Text>
            </View>
            <View>
              <Text style={styles.footerLabel}>Est. Total</Text>
              <Text style={styles.footerValue}>EGP {order.totalEstimate.toLocaleString()}</Text>
            </View>
            {order.maxOrderValue && (
              <View>
                <Text style={styles.footerLabel}>Cap</Text>
                <Text style={styles.footerValue}>EGP {order.maxOrderValue.toLocaleString()}</Text>
              </View>
            )}
          </View>

          {order.autoSubmit && (
            <View style={styles.autoBadge}>
              <Text style={styles.autoText}>Auto-Submit</Text>
            </View>
          )}
        </View>
      )) : (
        <View style={styles.emptyCard}>
          <CalendarClock size={32} color={colors.textMuted} />
          <Text style={styles.emptyText}>No scheduled orders</Text>
          <Text style={styles.emptySubtext}>Set up recurring orders for regular supplies</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 100 },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
  headerTitle: { ...typography.h2, color: colors.text, flex: 1 },
  addBtn: { backgroundColor: colors.primary, width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  filterRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  filterBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.sm, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  filterBtnActive: { backgroundColor: colors.primary + "20", borderColor: colors.primary },
  filterText: { ...typography.bodySmall, color: colors.textMuted },
  filterTextActive: { color: colors.primary, fontWeight: "600" },
  orderCard: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderInfo: { flex: 1 },
  orderName: { ...typography.body, color: colors.text, fontWeight: "600" },
  orderSupplier: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  statusToggle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  orderDetails: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.md },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailText: { ...typography.bodySmall, color: colors.textSecondary },
  orderFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  footerLabel: { ...typography.caption, color: colors.textMuted },
  footerValue: { ...typography.body, color: colors.text, fontWeight: "500", marginTop: 2 },
  autoBadge: { backgroundColor: colors.accent + "20", borderRadius: radii.sm, paddingHorizontal: spacing.sm, paddingVertical: 2, alignSelf: "flex-start", marginTop: spacing.sm },
  autoText: { ...typography.caption, color: colors.accent, fontWeight: "600" },
  emptyCard: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.xxl, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  emptyText: { ...typography.body, color: colors.textMuted, marginTop: spacing.md },
  emptySubtext: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.xs, textAlign: "center" },
});
