/**
 * Orders Screen — Hotel Buyer
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
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
  PARTIALLY_DELIVERED: colors.warning,
  DELIVERED: colors.approved,
  CANCELLED: colors.textMuted,
};

export default function OrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data } = await orderAPI.list();
      if (data.success && data.data) setOrders(data.data);
    } catch {} finally { setRefreshing(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const renderItem = ({ item }: { item: Order }) => {
    const canStartReceiving = item.status === "IN_TRANSIT" || item.status === "PARTIALLY_DELIVERED";
    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.orderSummary}
          onPress={() => navigation.navigate("OrderDetail", { id: item.id })}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Open purchase order ${item.orderNumber}`}
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
        {canStartReceiving ? (
          <TouchableOpacity
            style={styles.receiveButton}
            onPress={() => navigation.navigate("ControlledReceipt", { orderId: item.id })}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Start receiving purchase order ${item.orderNumber}`}
          >
            <Text style={styles.receiveButtonText}>Receive delivery</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={colors.primary} />}
      ListEmptyComponent={<Text style={styles.empty}>No orders yet</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md },
  card: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  orderSummary: { gap: spacing.xs },
  receiveButton: { minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: radii.md, backgroundColor: colors.primary + "20", borderWidth: 1, borderColor: colors.primary + "66" },
  receiveButtonText: { ...typography.bodySmall, color: colors.primary, fontWeight: "700" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderNum: { ...typography.h3, color: colors.text },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.full },
  statusText: { ...typography.label, textTransform: "uppercase" },
  supplier: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md },
  amount: { ...typography.body, color: colors.primary, fontWeight: "600" },
  date: { ...typography.caption, color: colors.textMuted },
  empty: { ...typography.body, color: colors.textMuted, textAlign: "center", marginTop: spacing.xxxl * 3 },
});
