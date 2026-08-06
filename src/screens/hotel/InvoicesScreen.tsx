/**
 * Invoices Screen — Hotel Buyer
 */

import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { invoiceAPI } from "@/api";
import type { Invoice } from "@/types";

export default function InvoicesScreen({ navigation }: any) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInvoices = async () => {
    try {
      const { data } = await invoiceAPI.list();
      if (data.success && data.data) setInvoices(data.data);
    } catch {} finally { setRefreshing(false); }
  };

  useEffect(() => { fetchInvoices(); }, []);

   const renderItem = ({ item }: { item: Invoice }) => (
     <TouchableOpacity
       style={styles.card}
       onPress={() => navigation.navigate("InvoiceDetail", { id: item.id })}
       activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.invoiceNum}>{item.invoiceNumber}</Text>
          <View style={[styles.statusDot, { backgroundColor: item.status === "PAID" ? colors.success : colors.pending }]} />
        </View>
        <Text style={styles.supplier}>{item.supplierName || "—"}</Text>
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.amount}>EGP {item.totalAmount.toLocaleString()}</Text>
            <Text style={styles.vat}>VAT: EGP {item.vatAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.etaRow}>
            {item.etaStatus && (
              <View style={styles.etaBadge}>
                <Text style={styles.etaText}>ETA: {item.etaStatus}</Text>
              </View>
            )}
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
      </TouchableOpacity>
  );

  return (
    <FlatList
      data={invoices}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInvoices(); }} tintColor={colors.primary} />}
      ListEmptyComponent={<Text style={styles.empty}>No invoices yet</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md },
  card: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  invoiceNum: { ...typography.h3, color: colors.text },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  supplier: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: spacing.md },
  amount: { ...typography.body, color: colors.primary, fontWeight: "600" },
  vat: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  etaRow: { alignItems: "flex-end", gap: spacing.xs },
  etaBadge: { backgroundColor: colors.info + "20", paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.full },
  etaText: { ...typography.caption, color: colors.info },
  date: { ...typography.caption, color: colors.textMuted },
  empty: { ...typography.body, color: colors.textMuted, textAlign: "center", marginTop: spacing.xxxl * 3 },
});
