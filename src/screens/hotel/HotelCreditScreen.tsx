/**
 * Hotel Credit Overview Screen — Credit limit, utilization, facilities
 */

import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity,
} from "react-native";
import { CreditCard, TrendingUp, AlertTriangle, Building2 } from "lucide-react-native";
import { colors, spacing, radii, typography } from "@/theme";
import api from "@/api";

interface CreditData {
  creditLimit: number;
  creditUsed: number;
  utilization: number;
  riskTier: string;
  facilities: Array<{
    id: string;
    name: string;
    limit: number;
    utilized: number;
    interestRate: number;
    status: string;
  }>;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    date: string;
    description: string;
  }>;
}

export default function HotelCreditScreen({ navigation }: any) {
  const [data, setData] = useState<CreditData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const { data: res } = await api.get("/hotel/credit");
      if (res.success) setData(res.data);
    } catch {} finally { setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const utilizationColor = (data?.utilization ?? 0) > 80 ? colors.error
    : (data?.utilization ?? 0) > 60 ? colors.warning : colors.success;

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
    >
      {/* Credit Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <CreditCard size={20} color={colors.primary} />
          <Text style={styles.summaryTitle}>Credit Overview</Text>
        </View>

        <View style={styles.limitRow}>
          <View>
            <Text style={styles.limitLabel}>Credit Limit</Text>
            <Text style={styles.limitValue}>EGP {(data?.creditLimit ?? 0).toLocaleString()}</Text>
          </View>
          <View>
            <Text style={styles.limitLabel}>Used</Text>
            <Text style={[styles.limitValue, { color: utilizationColor }]}>
              EGP {(data?.creditUsed ?? 0).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Utilization Bar */}
        <View style={styles.barContainer}>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${Math.min(data?.utilization ?? 0, 100)}%`, backgroundColor: utilizationColor }]} />
          </View>
          <Text style={[styles.barLabel, { color: utilizationColor }]}>{(data?.utilization ?? 0).toFixed(1)}%</Text>
        </View>

        <View style={styles.riskRow}>
          <AlertTriangle size={14} color={colors.warning} />
          <Text style={styles.riskText}>Risk Tier: {data?.riskTier ?? "N/A"}</Text>
        </View>
      </View>

      {/* Credit Facilities */}
      <Text style={styles.sectionTitle}>Credit Facilities</Text>
      {data?.facilities?.length ? data.facilities.map((f) => (
        <View key={f.id} style={styles.facilityCard}>
          <View style={styles.facilityHeader}>
            <Building2 size={16} color={colors.accent} />
            <Text style={styles.facilityName}>{f.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: f.status === "ACTIVE" ? colors.success + "20" : colors.warning + "20" }]}>
              <Text style={[styles.statusText, { color: f.status === "ACTIVE" ? colors.success : colors.warning }]}>{f.status}</Text>
            </View>
          </View>
          <View style={styles.facilityDetails}>
            <View>
              <Text style={styles.detailLabel}>Limit</Text>
              <Text style={styles.detailValue}>EGP {f.limit.toLocaleString()}</Text>
            </View>
            <View>
              <Text style={styles.detailLabel}>Utilized</Text>
              <Text style={styles.detailValue}>EGP {f.utilized.toLocaleString()}</Text>
            </View>
            <View>
              <Text style={styles.detailLabel}>Rate</Text>
              <Text style={styles.detailValue}>{f.interestRate}%</Text>
            </View>
          </View>
        </View>
      )) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No credit facilities active</Text>
        </View>
      )}

      {/* Recent Transactions */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {data?.recentTransactions?.length ? data.recentTransactions.slice(0, 5).map((t) => (
        <View key={t.id} style={styles.transactionRow}>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionDesc}>{t.description}</Text>
            <Text style={styles.transactionDate}>{new Date(t.date).toLocaleDateString()}</Text>
          </View>
          <Text style={[styles.transactionAmount, { color: t.type === "CREDIT" ? colors.success : colors.error }]}>
            {t.type === "CREDIT" ? "+" : "-"}EGP {t.amount.toLocaleString()}
          </Text>
        </View>
      )) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No recent transactions</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 100 },
  summaryCard: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  summaryHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
  summaryTitle: { ...typography.h3, color: colors.text },
  limitRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.md },
  limitLabel: { ...typography.bodySmall, color: colors.textMuted },
  limitValue: { ...typography.h2, color: colors.text, marginTop: 4 },
  barContainer: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  barBg: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4 },
  barFill: { height: 8, borderRadius: 4 },
  barLabel: { ...typography.label, minWidth: 45, textAlign: "right" },
  riskRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.md },
  riskText: { ...typography.bodySmall, color: colors.textSecondary },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
  facilityCard: { backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  facilityHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  facilityName: { ...typography.body, color: colors.text, flex: 1, fontWeight: "600" },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.sm },
  statusText: { ...typography.caption, fontWeight: "600" },
  facilityDetails: { flexDirection: "row", justifyContent: "space-between" },
  detailLabel: { ...typography.caption, color: colors.textMuted },
  detailValue: { ...typography.body, color: colors.text, fontWeight: "500", marginTop: 2 },
  transactionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  transactionInfo: { flex: 1 },
  transactionDesc: { ...typography.body, color: colors.text },
  transactionDate: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  transactionAmount: { ...typography.body, fontWeight: "600" },
  emptyCard: { backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.xl, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  emptyText: { ...typography.body, color: colors.textMuted },
});
