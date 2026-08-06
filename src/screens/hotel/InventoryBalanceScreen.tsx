/**
 * Inventory Balance Screen — Beginning/ending inventory, quantity balance, variance
 */

import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity,
} from "react-native";
import { ClipboardList, Package, TrendingDown, TrendingUp, AlertTriangle, ChevronRight } from "lucide-react-native";
import { colors, spacing, radii, typography } from "@/theme";
import api from "@/api";

interface ReconciliationLineItem {
  id: string;
  productName: string;
  sku: string;
  beginningQuantity: number;
  endingQuantity: number;
  receivedQuantity: number;
  consumedQuantity: number;
  wasteQuantity: number;
  varianceQuantity: number;
  varianceReason: string | null;
  unitCost: number;
  totalValue: number;
}

interface Reconciliation {
  id: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  lineItems: ReconciliationLineItem[];
}

export default function InventoryBalanceScreen({ navigation }: any) {
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [selected, setSelected] = useState<Reconciliation | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const { data: res } = await api.get("/hotel/inventory/reconciliations");
      if (res.success) {
        const items = res.data ?? [];
        setReconciliations(items);
        if (items.length > 0 && !selected) setSelected(items[0]);
      }
    } catch {} finally { setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const totalVariance = selected?.lineItems?.reduce((sum, item) => sum + Math.abs(item.varianceQuantity), 0) ?? 0;
  const totalValue = selected?.lineItems?.reduce((sum, item) => sum + (item.totalValue ?? 0), 0) ?? 0;
  const totalWaste = selected?.lineItems?.reduce((sum, item) => sum + item.wasteQuantity, 0) ?? 0;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <ClipboardList size={20} color={colors.primary} />
        <Text style={styles.headerTitle}>Inventory Balance</Text>
      </View>

      {/* Period Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
        {reconciliations.map((r) => (
          <TouchableOpacity
            key={r.id}
            style={[styles.periodChip, selected?.id === r.id && styles.periodChipActive]}
            onPress={() => setSelected(r)}
          >
            <Text style={[styles.periodText, selected?.id === r.id && styles.periodTextActive]}>{r.period}</Text>
            <View style={[styles.statusDot, { backgroundColor: r.status === "APPROVED" ? colors.success : colors.warning }]} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selected ? (
        <>
          {/* Summary Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: totalVariance > 0 ? colors.error : colors.success }]}>
                {totalVariance}
              </Text>
              <Text style={styles.statLabel}>Total Variance</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.warning }]}>{totalWaste}</Text>
              <Text style={styles.statLabel}>Waste/Damage</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>EGP {totalValue.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Value</Text>
            </View>
          </View>

          {/* Line Items */}
          <Text style={styles.sectionTitle}>Items ({selected.lineItems?.length ?? 0})</Text>
          {selected.lineItems?.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Package size={16} color={colors.accent} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  <Text style={styles.itemSku}>{item.sku}</Text>
                </View>
                {item.varianceQuantity !== 0 && (
                  <View style={[styles.varianceBadge, { backgroundColor: item.varianceQuantity > 0 ? colors.success + "20" : colors.error + "20" }]}>
                    {item.varianceQuantity > 0 ? (
                      <TrendingUp size={12} color={colors.success} />
                    ) : (
                      <TrendingDown size={12} color={colors.error} />
                    )}
                    <Text style={[styles.varianceText, { color: item.varianceQuantity > 0 ? colors.success : colors.error }]}>
                      {item.varianceQuantity > 0 ? "+" : ""}{item.varianceQuantity}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.qtyGrid}>
                <View style={styles.qtyItem}>
                  <Text style={styles.qtyLabel}>Beginning</Text>
                  <Text style={styles.qtyValue}>{item.beginningQuantity}</Text>
                </View>
                <View style={styles.qtyItem}>
                  <Text style={styles.qtyLabel}>Received</Text>
                  <Text style={[styles.qtyValue, { color: colors.success }]}>{item.receivedQuantity}</Text>
                </View>
                <View style={styles.qtyItem}>
                  <Text style={styles.qtyLabel}>Consumed</Text>
                  <Text style={[styles.qtyValue, { color: colors.warning }]}>{item.consumedQuantity}</Text>
                </View>
                <View style={styles.qtyItem}>
                  <Text style={styles.qtyLabel}>Ending</Text>
                  <Text style={styles.qtyValue}>{item.endingQuantity}</Text>
                </View>
              </View>

              {item.wasteQuantity > 0 && (
                <View style={styles.wasteRow}>
                  <AlertTriangle size={12} color={colors.error} />
                  <Text style={styles.wasteText}>Waste: {item.wasteQuantity} units</Text>
                </View>
              )}

              {item.varianceReason && (
                <Text style={styles.reasonText}>Reason: {item.varianceReason}</Text>
              )}

              <View style={styles.valueRow}>
                <Text style={styles.valueLabel}>Unit Cost: EGP {item.unitCost?.toLocaleString()}</Text>
                <Text style={styles.valueTotal}>Total: EGP {item.totalValue?.toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </>
      ) : (
        <View style={styles.emptyCard}>
          <ClipboardList size={32} color={colors.textMuted} />
          <Text style={styles.emptyText}>No reconciliation periods found</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 100 },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
  headerTitle: { ...typography.h2, color: colors.text },
  periodScroll: { marginBottom: spacing.lg },
  periodChip: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.sm, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, marginRight: spacing.sm },
  periodChipActive: { backgroundColor: colors.primary + "20", borderColor: colors.primary },
  periodText: { ...typography.bodySmall, color: colors.textMuted },
  periodTextActive: { color: colors.primary, fontWeight: "600" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  statCard: { flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  statValue: { ...typography.h3, fontWeight: "600" },
  statLabel: { ...typography.caption, color: colors.textMuted, marginTop: 4, textAlign: "center" },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  itemCard: { backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  itemHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  itemInfo: { flex: 1 },
  itemName: { ...typography.body, color: colors.text, fontWeight: "600" },
  itemSku: { ...typography.caption, color: colors.textMuted },
  varianceBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.sm },
  varianceText: { ...typography.caption, fontWeight: "600" },
  qtyGrid: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  qtyItem: { alignItems: "center" },
  qtyLabel: { ...typography.caption, color: colors.textMuted },
  qtyValue: { ...typography.body, color: colors.text, fontWeight: "600", marginTop: 2 },
  wasteRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.sm },
  wasteText: { ...typography.bodySmall, color: colors.error },
  reasonText: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs, fontStyle: "italic" },
  valueRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  valueLabel: { ...typography.bodySmall, color: colors.textMuted },
  valueTotal: { ...typography.body, color: colors.text, fontWeight: "600" },
  emptyCard: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.xxl, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  emptyText: { ...typography.body, color: colors.textMuted, marginTop: spacing.md },
});
