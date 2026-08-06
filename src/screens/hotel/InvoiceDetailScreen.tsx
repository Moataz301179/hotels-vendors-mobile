import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, Alert,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { invoiceAPI } from "@/api";
import { fmtMoney, fmtDate, orderStatusLabel, orderStatusColor } from "@/utils/format";
import { Download, CreditCard, Calendar, FileText, Hash, Building, CheckCircle } from "lucide-react-native";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;
  status: string;
  etaStatus?: string | null;
  createdAt: string;
  dueDate?: string | null;
  supplierName?: string | null;
  hotelName?: string | null;
  items: InvoiceItem[];
  etaUuid?: string | null;
  etaSerial?: string | null;
}

function Row({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        {icon}
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function InvoiceDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await invoiceAPI.get(id);
      if (data.success && data.data) setInvoice(data.data.invoice || data.data);
    } catch {
      Alert.alert("Error", "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handlePay = () => {
    if (!invoice) return;
    navigation.navigate("PaymentScreen" as never, {
      invoiceId: invoice.id,
      amount: invoice.totalAmount,
      currency: invoice.currency,
      invoiceNumber: invoice.invoiceNumber,
    } as never);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Invoice not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const canPay = invoice.status !== "PAID" && invoice.status !== "CANCELLED";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.invoiceNum}>{invoice.invoiceNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: orderStatusColor(invoice.status) + "22" }]}>
            <Text style={[styles.statusText, { color: orderStatusColor(invoice.status) }]}>
              {orderStatusLabel(invoice.status)}
            </Text>
          </View>
        </View>
        <FileText size={24} color={colors.textMuted} />
      </View>

      {invoice.supplierName ? (
        <Text style={styles.supplier}>{invoice.supplierName}</Text>
      ) : null}

      <View style={styles.summaryCard}>
        <Row label="Total Amount" value={fmtMoney(invoice.totalAmount)} icon={<FileText size={16} color={colors.textMuted} />} />
        <Row label="VAT" value={fmtMoney(invoice.vatAmount)} icon={<FileText size={16} color={colors.textMuted} />} />
        <Row label="Amount (excl. VAT)" value={fmtMoney(invoice.amount)} icon={<FileText size={16} color={colors.textMuted} />} />
        <Row label="Issue date" value={fmtDate(invoice.createdAt)} icon={<Calendar size={16} color={colors.textMuted} />} />
        {invoice.dueDate ? <Row label="Due date" value={fmtDate(invoice.dueDate)} icon={<Calendar size={16} color={colors.textMuted} />} /> : null}
        {invoice.etaUuid ? <Row label="ETA UUID" value={invoice.etaUuid} icon={<Hash size={16} color={colors.textMuted} />} /> : null}
      </View>

      {invoice.etaStatus ? (
        <View style={styles.etaBadge}>
          <CheckCircle size={16} color={invoice.etaStatus === "ACCEPTED" ? colors.success : colors.info} />
          <Text style={styles.etaText}>ETA Status: {invoice.etaStatus}</Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Line Items</Text>
      <View style={styles.itemsCard}>
        {invoice.items.map((it) => (
          <View key={it.id} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{it.description}</Text>
              <Text style={styles.muted}>{it.quantity} × {fmtMoney(it.unitPrice)}</Text>
            </View>
            <Text style={styles.itemTotal}>{fmtMoney(it.total)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{fmtMoney(invoice.totalAmount)}</Text>
        </View>
      </View>

      {canPay && (
      <TouchableOpacity
        style={styles.payBtn}
        onPress={handlePay}
        activeOpacity={0.8}
      >
        <>
          <CreditCard size={18} color={colors.bg} style={{ marginRight: spacing.sm }} />
          <Text style={styles.payBtnText}>Pay Now</Text>
        </>
      </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.downloadBtn}
        onPress={() => Alert.alert("Download", "ETA-compliant PDF download is being prepared.")}
        activeOpacity={0.7}
      >
        <Download size={16} color={colors.textSecondary} />
        <Text style={styles.downloadText}>Download ETA PDF</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" },
  emptyTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  backLink: { color: colors.primary, ...typography.bodySmall },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  invoiceNum: { ...typography.h2, color: colors.text, flex: 1 },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    alignSelf: "flex-start",
  },
  statusText: { ...typography.caption, textTransform: "uppercase", fontWeight: "600" },
  supplier: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, marginBottom: spacing.md },
  summaryCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  etaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.success + "22",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    marginBottom: spacing.md,
  },
  etaText: { ...typography.caption, color: colors.success, fontWeight: "600" },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  itemsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemName: { ...typography.body, color: colors.text },
  muted: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  itemTotal: { ...typography.body, color: colors.text, fontWeight: "600", textAlign: "right" },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  totalLabel: { ...typography.h3, color: colors.textSecondary },
  totalValue: { ...typography.h2, color: colors.primary, fontWeight: "600" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  rowLabel: { ...typography.bodySmall, color: colors.textMuted },
  rowValue: { ...typography.bodySmall, color: colors.text, flex: 1.6, textAlign: "right" },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  payBtnText: { color: colors.bg, fontWeight: "600", fontSize: 16 },
  downloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.md,
  },
  downloadText: { ...typography.bodySmall, color: colors.textSecondary },
});
