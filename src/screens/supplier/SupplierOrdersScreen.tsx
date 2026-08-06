/**
 * Supplier Orders — list of incoming orders from hotels with status management
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { supplierAPI, orderAPI } from "@/api";
import { orderStatusColor, orderStatusLabel, fmtMoney, fmtDate } from "@/utils/format";
import {
  ClipboardList, ChevronRight, Package, User, Calendar, Check, X, Clock,
} from "lucide-react-native";

interface SupplierOrder {
  id: string;
  orderNumber: string;
  poNumber?: string | null;
  status: string;
  totalAmount: number;
  currency: string;
  createdAt: string;
  deliveryDate?: string | null;
  hotelName?: string;
  hotelCity?: string | null;
  items: { id: string; product: { name: string; sku?: string } }[];
}

export default function SupplierOrdersScreen({ navigation }: any) {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await supplierAPI.orders();
      if (data.success && data.data) setOrders(data.data.orders || []);
    } catch {} finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleApprove = async (orderId: string) => {
    try {
      await orderAPI.approve(orderId);
      fetchOrders();
    } catch (e: any) {
      console.error("Approve failed:", e.response?.data?.error || e.message);
    }
  };

  const handleReject = async (orderId: string) => {
    try {
      await orderAPI.reject(orderId, "Supplier rejection");
      fetchOrders();
    } catch (e: any) {
      console.error("Reject failed:", e.response?.data?.error || e.message);
    }
  };

  const renderItem = ({ item }: { item: SupplierOrder }) => {
    const canApprove = item.status === "PENDING_APPROVAL" || item.status === "CONFIRMED";
    const statusColor = orderStatusColor(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("OrderDetail", { id: item.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNum}>{item.orderNumber}</Text>
            {item.poNumber ? <Text style={styles.muted}>PO: {item.poNumber}</Text> : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + "22" }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {orderStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <User size={16} color={colors.textMuted} />
            <Text style={styles.infoText}>{item.hotelName || "Hotel"}</Text>
            {item.hotelCity ? <Text style={styles.infoTextDot}>{item.hotelCity}</Text> : null}
          </View>

          <View style={styles.infoRow}>
            <Calendar size={16} color={colors.textMuted} />
            <Text style={styles.infoText}>{fmtDate(item.createdAt)}</Text>
            {item.deliveryDate ? (
              <>
                <Clock size={16} color={colors.textMuted} style={{ marginLeft: spacing.md }} />
                <Text style={styles.infoText}>Due {fmtDate(item.deliveryDate)}</Text>
              </>
            ) : null}
          </View>

          <View style={styles.itemsRow}>
            <Package size={14} color={colors.textMuted} />
            <Text style={styles.infoText}>{item.items.length} item(s)</Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.amount}>{fmtMoney(item.totalAmount)}</Text>
            {canApprove && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => handleReject(item.id)}
                  activeOpacity={0.7}
                >
                  <X size={16} color={colors.error} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => handleApprove(item.id)}
                  activeOpacity={0.7}
                >
                  <Check size={16} color={colors.success} />
                </TouchableOpacity>
              </View>
            )}
            <ChevronRight size={16} color={colors.textMuted} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { (fetchOrders as any)(); setRefreshing(false); }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ClipboardList size={48} color={colors.textMuted} />
            <Text style={styles.empty}>No orders yet</Text>
            <Text style={styles.emptySub}>Orders from hotels will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  orderInfo: { flex: 1, marginRight: spacing.md },
  orderNum: {
    ...typography.h3,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  badgeText: {
    ...typography.caption,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  muted: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  infoTextDot: {
    ...typography.caption,
    color: colors.textMuted,
    marginLeft: 4,
  },
  itemsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  amount: {
    ...typography.body,
    color: colors.primary,
    fontWeight: "700",
  },
  actionButtons: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  approveBtn: {
    backgroundColor: colors.success + "11",
    borderColor: colors.success + "44",
  },
  rejectBtn: {
    backgroundColor: colors.error + "11",
    borderColor: colors.error + "44",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing.xxxl * 2,
    gap: spacing.md,
  },
  empty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  emptySub: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
