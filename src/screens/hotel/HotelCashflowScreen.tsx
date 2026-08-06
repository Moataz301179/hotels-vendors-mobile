/**
 * Hotel Cashflow Screen — Spend trends, pending/overdue payments
 */

import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity,
} from "react-native";
import { DollarSign, TrendingUp, TrendingDown, Clock, AlertCircle } from "lucide-react-native";
import { colors, spacing, radii, typography } from "@/theme";
import api from "@/api";

interface CashflowData {
  monthlySpend: number;
  pendingPayments: number;
  overduePayments: number;
  upcomingPayments: number;
  trend: Array<{ month: string; amount: number }>;
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
    dueDate: string;
    status: string;
    supplierName: string;
  }>;
}

export default function HotelCashflowScreen({ navigation }: any) {
  const [data, setData] = useState<CashflowData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const { data: res } = await api.get("/hotel/cashflow");
      if (res.success) setData(res.data);
    } catch {} finally { setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const maxTrend = Math.max(...(data?.trend?.map((t) => t.amount) ?? [1]));

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
    >
      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        {[
          { label: "Monthly Spend", value: data?.monthlySpend ?? 0, icon: DollarSign, color: colors.primary },
          { label: "Pending", value: data?.pendingPayments ?? 0, icon: Clock, color: colors.warning },
          { label: "Overdue", value: data?.overduePayments ?? 0, icon: AlertCircle, color: colors.error },
          { label: "Upcoming", value: data?.upcomingPayments ?? 0, icon: TrendingUp, color: colors.info },
        ].map((item) => (
          <View key={item.label} style={styles.summaryCard}>
            <item.icon size={16} color={item.color} />
            <Text style={[styles.summaryValue, { color: item.color }]}>EGP {item.value.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Spend Trend */}
      <Text style={styles.sectionTitle}>6-Month Spend Trend</Text>
      <View style={styles.chartCard}>
        <View style={styles.chartBars}>
          {data?.trend?.map((t, i) => (
            <View key={i} style={styles.barWrapper}>
              <View style={styles.barTrack}>
                <View style={[styles.bar, { height: `${(t.amount / maxTrend) * 100}%`, backgroundColor: colors.primary }]} />
              </View>
              <Text style={styles.barLabel}>{t.month.split("-")[1]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Invoices */}
      <Text style={styles.sectionTitle}>Recent Invoices</Text>
      {data?.recentInvoices?.length ? data.recentInvoices.map((inv) => (
        <TouchableOpacity
          key={inv.id}
          style={styles.invoiceRow}
          onPress={() => navigation.navigate("InvoiceDetail", { id: inv.id })}
        >
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceNumber}>{inv.invoiceNumber}</Text>
            <Text style={styles.invoiceSupplier}>{inv.supplierName}</Text>
            <Text style={styles.invoiceDue}>Due: {new Date(inv.dueDate).toLocaleDateString()}</Text>
          </View>
          <View style={styles.invoiceRight}>
            <Text style={styles.invoiceAmount}>EGP {inv.amount.toLocaleString()}</Text>
            <View style={[styles.statusBadge, {
              backgroundColor: inv.status === "PAID" ? colors.success + "20"
                : inv.status === "OVERDUE" ? colors.error + "20" : colors.warning + "20",
            }]}>
              <Text style={[styles.statusText, {
                color: inv.status === "PAID" ? colors.success
                  : inv.status === "OVERDUE" ? colors.error : colors.warning,
              }]}>{inv.status}</Text>
            </View>
          </View>
        </TouchableOpacity>
      )) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No recent invoices</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 100 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  summaryCard: { flex: 1, minWidth: "45%", backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  summaryValue: { ...typography.h3, marginTop: spacing.xs, fontWeight: "600" },
  summaryLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
  chartCard: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  chartBars: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 120 },
  barWrapper: { flex: 1, alignItems: "center" },
  barTrack: { width: 24, height: 100, backgroundColor: colors.border, borderRadius: 4, justifyContent: "flex-end" },
  bar: { width: 24, borderRadius: 4 },
  barLabel: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  invoiceRow: { flexDirection: "row", justifyContent: "space-between", backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  invoiceInfo: { flex: 1 },
  invoiceNumber: { ...typography.body, color: colors.text, fontWeight: "600" },
  invoiceSupplier: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  invoiceDue: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  invoiceRight: { alignItems: "flex-end", gap: spacing.xs },
  invoiceAmount: { ...typography.body, color: colors.text, fontWeight: "600" },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.sm },
  statusText: { ...typography.caption, fontWeight: "600" },
  emptyCard: { backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.xl, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  emptyText: { ...typography.body, color: colors.textMuted },
});
