/**
 * GRN — Goods Received Notes list
 * Suppliers review received goods, confirm quantities, flag issues.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { supplierAPI } from "@/api";
import { orderStatusColor, orderStatusLabel, fmtDate } from "@/utils/format";
import {
  ClipboardCheck, Calendar, MapPin, Package, User, AlertCircle,
} from "lucide-react-native";

interface Grn {
  id: string;
  grnNumber: string;
  status: string;
  receivedAt: string;
  order?: { id: string; orderNumber: string } | null;
  hotel?: { id: string; name: string } | null;
  lineItems: { id: string; product: { name: string } }[];
  vehiclePlate?: string | null;
  warehouseLocation?: string | null;
  deliveryNoteRef?: string | null;
  supplier?: { id: string; name: string } | null;
}

export default function GrnScreen({ navigation }: any) {
  const [grns, setGrns] = useState<Grn[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGrns = useCallback(async () => {
    try {
      const { data } = await supplierAPI.grns();
      if (data.success && data.data) setGrns(data.data.grns || []);
    } catch {} finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchGrns(); }, [fetchGrns]);

  const renderItem = ({ item }: { item: Grn }) => {
    const isPartial = item.status === "PARTIALLY_ACCEPTED";
    const isRejected = item.status === "REJECTED";

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("OrderDetail", { id: item.order?.id })}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.grnInfo}>
            <View style={styles.rowGap}>
              <Text style={styles.grnNumber}>{item.grnNumber}</Text>
              <View style={[styles.statusBadge, { backgroundColor: orderStatusColor(item.status) + "22" }]}>
                <Text style={[styles.badgeText, { color: orderStatusColor(item.status) }]}>
                  {orderStatusLabel(item.status)}
                </Text>
              </View>
            </View>
            {item.order?.orderNumber ? (
              <Text style={styles.muted}>Order: {item.order.orderNumber}</Text>
            ) : null}
          </View>
          <ClipboardCheck size={22} color={colors.primary} />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Calendar size={16} color={colors.textMuted} />
            <Text style={styles.infoText}>{fmtDate(item.receivedAt)}</Text>
            {item.hotel?.name ? (
              <>
                <User size={16} color={colors.textMuted} style={{ marginLeft: spacing.md }} />
                <Text style={styles.infoText}>{item.hotel.name}</Text>
              </>
            ) : null}
          </View>

          {item.vehiclePlate ? (
            <View style={styles.infoRow}>
              <Package size={16} color={colors.textMuted} />
              <Text style={styles.infoText}>Vehicle: {item.vehiclePlate}</Text>
            </View>
          ) : null}

          {item.deliveryNoteRef ? (
            <View style={styles.infoRow}>
              <MapPin size={16} color={colors.textMuted} />
              <Text style={styles.infoText}>Delivery note: {item.deliveryNoteRef}</Text>
            </View>
          ) : null}

          <View style={styles.itemsRow}>
            <Text style={styles.muted}>{item.lineItems.length} line item(s)</Text>
            {(isPartial || isRejected) && (
              <View style={[styles.alertChip, { backgroundColor: colors.error + "11" }]}>
                <AlertCircle size={12} color={colors.error} />
                <Text style={[styles.alertText, { color: colors.error }]}>
                  {isRejected ? "Rejected" : "Partially accepted"}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={grns}
        keyExtractor={(g) => g.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchGrns(); }}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ClipboardCheck size={48} color={colors.textMuted} />
            <Text style={styles.empty}>No goods received notes yet</Text>
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
  grnInfo: { flex: 1, marginRight: spacing.md },
  grnNumber: {
    ...typography.h3,
    color: colors.text,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    marginTop: 4,
  },
  badgeText: {
    ...typography.caption,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  rowGap: { gap: 2 },
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
  itemsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  alertChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  alertText: {
    ...typography.caption,
    fontWeight: "600",
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
});
