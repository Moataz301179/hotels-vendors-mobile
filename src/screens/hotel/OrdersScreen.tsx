/**
 * Orders Screen — Hotel Buyer
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ScrollView,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { orderAPI } from "@/api";
import type { Order, OrderStatus } from "@/types";

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: colors.pending,
  APPROVED: colors.success,
  REJECTED: colors.error,
  CONFIRMED: colors.info,
  IN_TRANSIT: colors.disbursed,
  DELIVERED: colors.approved,
  CANCELLED: colors.textMuted,
};

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"ALL" | OrderStatus>("ALL");

  const fetchOrders = async () => {
    try {
      const { data } = await orderAPI.list();
      if (data.success && data.data) setOrders(data.data);
    } catch {} finally { setRefreshing(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const visibleOrders = orders
    .filter((order) => filter === "ALL" || order.status === filter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const renderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("OrderDetail", { id: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.orderNum}>{item.orderNumber}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + "20" }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.supplier}>{item.supplierName || "—"}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.amount}>EGP {item.totalAmount.toLocaleString()}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={visibleOrders}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={colors.primary} />}
      ListHeaderComponent={
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {["ALL", "PENDING", "APPROVED", "IN_TRANSIT", "DELIVERED", "REJECTED"].map((value) => (
            <TouchableOpacity
              key={value}
              onPress={() => setFilter(value as "ALL" | OrderStatus)}
              style={[styles.filter, filter === value && styles.filterActive]}
            >
              <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
                {value === "ALL" ? "All" : value.replace("_", " ")}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      }
      ListEmptyComponent={<Text style={styles.empty}>No orders yet</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md },
  card: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderNum: { ...typography.h3, color: colors.text },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.full },
  statusText: { ...typography.label, textTransform: "uppercase" },
  supplier: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md },
  amount: { ...typography.body, color: colors.primary, fontWeight: "600" },
  date: { ...typography.caption, color: colors.textMuted },
  empty: { ...typography.body, color: colors.textMuted, textAlign: "center", marginTop: spacing.xxxl * 3 },
  filters: { gap: spacing.sm, paddingBottom: spacing.md },
  filter: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.full, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  filterActive: { backgroundColor: colors.primary + "22", borderColor: colors.primary },
  filterText: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
  filterTextActive: { color: colors.primary },
});
