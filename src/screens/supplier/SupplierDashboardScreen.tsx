/**
 * Supplier Dashboard Screen
 */

import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { supplierAPI } from "@/api";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  unit: string;
  inStock: boolean;
}

export default function SupplierDashboardScreen({ navigation }: any) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState({ totalProducts: 0, pendingOrders: 0, totalRevenue: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const { data } = await supplierAPI.inventory();
      if (data.success && data.data) {
        setInventory(data.data.items || []);
        setStats({
          totalProducts: data.data.items?.length || 0,
          pendingOrders: data.data.pendingOrders || 0,
          totalRevenue: data.data.totalRevenue || 0,
        });
      }
    } catch {} finally { setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <FlatList
      data={inventory}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={styles.statsRow}>
          {[
            { label: "Products", value: stats.totalProducts, color: colors.primary },
            { label: "Pending", value: stats.pendingOrders, color: colors.warning },
            { label: "Revenue", value: `EGP ${stats.totalRevenue.toLocaleString()}`, color: colors.success },
          ].map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={[styles.stockDot, { backgroundColor: item.inStock ? colors.success : colors.error }]} />
          </View>
          <Text style={styles.sku}>{item.sku}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.price}>EGP {item.price.toLocaleString()} / {item.unit}</Text>
            <Text style={styles.qty}>Qty: {item.quantity}</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No inventory items</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md },
  statsRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.sm },
  statCard: { flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  statValue: { ...typography.h2, fontWeight: "600" },
  statLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  card: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemName: { ...typography.h3, color: colors.text, flex: 1 },
  stockDot: { width: 10, height: 10, borderRadius: 5 },
  sku: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md },
  price: { ...typography.body, color: colors.primary, fontWeight: "600" },
  qty: { ...typography.bodySmall, color: colors.textSecondary },
  empty: { ...typography.body, color: colors.textMuted, textAlign: "center", marginTop: spacing.xxxl * 2 },
});
