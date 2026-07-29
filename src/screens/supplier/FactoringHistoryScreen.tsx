import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { fintechAPI } from "@/api";

interface FactoringTransaction {
  id: string;
  invoiceAmount: number;
  status: string;
  createdAt: string;
  disbursedAmount: number;
  invoiceNumber?: string;
}

export default function FactoringHistoryScreen() {
  const [transactions, setTransactions] = useState<FactoringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await fintechAPI.getFactoringHistory();
      if (data.success && data.data) {
        setTransactions(data.data);
      }
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "DISBURSED": return colors.disbursed;
      case "PAID": return colors.success;
      case "PENDING": return colors.pending;
      case "REJECTED": return colors.rejected;
      default: return colors.textMuted;
    }
  };

  const renderItem = ({ item }: { item: FactoringTransaction }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.invoiceNum}>
          {item.invoiceNumber || `Factoring #${item.id.slice(0, 8)}`}
        </Text>
        <View style={[styles.badge, { backgroundColor: statusColor(item.status) + "20" }]}>
          <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Invoice Amount</Text>
          <Text style={styles.amountValue}>
            EGP {item.invoiceAmount.toLocaleString()}
          </Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Disbursed</Text>
          <Text style={[styles.amountValue, { color: colors.success }]}>
            EGP {item.disbursedAmount.toLocaleString()}
          </Text>
        </View>
      </View>
      <Text style={styles.date}>
        {new Date(item.createdAt).toLocaleDateString("en-EG", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchHistory(); }}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Factoring History</Text>
          <Text style={styles.emptyDesc}>
            Invoices you submit for financing will appear here
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" },
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl * 2 },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  invoiceNum: { ...typography.h3, color: colors.text, flex: 1 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.full },
  badgeText: { ...typography.label, textTransform: "uppercase" },
  cardBody: { gap: spacing.sm, marginTop: spacing.md },
  amountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  amountLabel: { ...typography.bodySmall, color: colors.textMuted },
  amountValue: { ...typography.body, color: colors.text, fontWeight: "600" },
  date: { ...typography.caption, color: colors.textMuted, marginTop: spacing.md },
  emptyState: { alignItems: "center", paddingVertical: spacing.xxxl * 2, gap: spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...typography.h2, color: colors.text, textAlign: "center" },
  emptyDesc: { ...typography.body, color: colors.textSecondary, textAlign: "center" },
});
