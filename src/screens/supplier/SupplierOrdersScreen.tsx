/**
 * Supplier Orders Screen
 */

import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { supplierAPI } from "@/api";

interface SupplierOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  hotelName: string;
  items: Array<{ name: string; quantity: number; unitPrice: number }>;
  createdAt: string;
}

export default function SupplierOrdersScreen() {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const { data } = await supplierAPI.orders();
      if (data.success && data.data) setOrders(data.data);
    } catch {} finally { setRefreshing(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const renderItem = ({ item }: { item: SupplierOrder }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.orderNum}>{item.orderNumber}</Text>
        <View style={[styles.badge, { backgroundColor: item.status === "PENDING" ? colors.pending + "20" : colors.success + "20" }]}>
          <Text style={[styles.badgeText, { color: item.status === "PENDING" ? colors.pending : colors.success }]}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.hotel}>{item.hotelName}</Text>
      <Text style={styles.items}>{item.items.length} item(s)</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.amount}>EGP {item.totalAmount.toLocaleString()}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={colors.primary} />}
      ListEmptyComponent={<Text style={styles.empty}>No orders from hotels</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md },
  card: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderNum: { ...typography.h3, color: colors.text },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.full },
  badgeText: { ...typography.label, textTransform: "uppercase" },
  hotel: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  items: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md },
  amount: { ...typography.body, color: colors.primary, fontWeight: "600" },
  date: { ...typography.caption, color: colors.textMuted },
  empty: { ...typography.body, color: colors.textMuted, textAlign: "center", marginTop: spacing.xxxl * 3 },
});
