/**
 * Hotel Financing Screen — Invoice factoring, credit applications
 */

import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity,
} from "react-native";
import { Landmark, FileText, Clock, CheckCircle, XCircle, Upload } from "lucide-react-native";
import { colors, spacing, radii, typography } from "@/theme";
import api from "@/api";

interface FinancingData {
  eligibleInvoices: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
    supplierName: string;
    dueDate: string;
    factoringEligible: boolean;
  }>;
  activeFinancing: Array<{
    id: string;
    invoiceNumber: string;
    financedAmount: number;
    advanceRate: number;
    discountRate: number;
    status: string;
    partnerName: string;
  }>;
  creditApplications: Array<{
    id: string;
    amount: number;
    status: string;
    submittedAt: string;
    facilityName: string;
  }>;
}

export default function HotelFinancingScreen({ navigation }: any) {
  const [data, setData] = useState<FinancingData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const { data: res } = await api.get("/hotel/financing");
      if (res.success) setData(res.data);
    } catch {} finally { setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const statusIcon = (status: string) => {
    switch (status) {
      case "APPROVED": case "DISBURSED": return <CheckCircle size={14} color={colors.success} />;
      case "REJECTED": return <XCircle size={14} color={colors.error} />;
      default: return <Clock size={14} color={colors.warning} />;
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />}
    >
      {/* Eligible Invoices for Factoring */}
      <View style={styles.header}>
        <Landmark size={20} color={colors.primary} />
        <Text style={styles.headerTitle}>Financing</Text>
      </View>

      <Text style={styles.sectionTitle}>Eligible Invoices</Text>
      {data?.eligibleInvoices?.length ? data.eligibleInvoices.map((inv) => (
        <View key={inv.id} style={styles.invoiceCard}>
          <View style={styles.invoiceHeader}>
            <FileText size={16} color={colors.accent} />
            <Text style={styles.invoiceNumber}>{inv.invoiceNumber}</Text>
          </View>
          <Text style={styles.invoiceSupplier}>{inv.supplierName}</Text>
          <View style={styles.invoiceFooter}>
            <Text style={styles.invoiceAmount}>EGP {inv.amount.toLocaleString()}</Text>
            <Text style={styles.invoiceDue}>Due: {new Date(inv.dueDate).toLocaleDateString()}</Text>
          </View>
          {inv.factoringEligible && (
            <TouchableOpacity style={styles.factoringBtn}>
              <Text style={styles.factoringBtnText}>Request Factoring</Text>
            </TouchableOpacity>
          )}
        </View>
      )) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No eligible invoices</Text>
        </View>
      )}

      {/* Active Financing */}
      <Text style={styles.sectionTitle}>Active Financing</Text>
      {data?.activeFinancing?.length ? data.activeFinancing.map((f) => (
        <View key={f.id} style={styles.financingCard}>
          <View style={styles.financingHeader}>
            <Text style={styles.financingInvoice}>{f.invoiceNumber}</Text>
            <View style={styles.statusRow}>
              {statusIcon(f.status)}
              <Text style={styles.statusText}>{f.status}</Text>
            </View>
          </View>
          <View style={styles.financingDetails}>
            <View>
              <Text style={styles.detailLabel}>Financed</Text>
              <Text style={styles.detailValue}>EGP {f.financedAmount.toLocaleString()}</Text>
            </View>
            <View>
              <Text style={styles.detailLabel}>Advance</Text>
              <Text style={styles.detailValue}>{f.advanceRate}%</Text>
            </View>
            <View>
              <Text style={styles.detailLabel}>Discount</Text>
              <Text style={styles.detailValue}>{f.discountRate}%</Text>
            </View>
          </View>
          <Text style={styles.partnerText}>Partner: {f.partnerName}</Text>
        </View>
      )) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No active financing</Text>
        </View>
      )}

      {/* Credit Applications */}
      <Text style={styles.sectionTitle}>Credit Applications</Text>
      {data?.creditApplications?.length ? data.creditApplications.map((app) => (
        <View key={app.id} style={styles.applicationRow}>
          <View style={styles.appInfo}>
            <Text style={styles.appFacility}>{app.facilityName}</Text>
            <Text style={styles.appAmount}>EGP {app.amount.toLocaleString()}</Text>
            <Text style={styles.appDate}>{new Date(app.submittedAt).toLocaleDateString()}</Text>
          </View>
          <View style={styles.statusRow}>
            {statusIcon(app.status)}
            <Text style={styles.statusText}>{app.status}</Text>
          </View>
        </View>
      )) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No credit applications</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 100 },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
  headerTitle: { ...typography.h2, color: colors.text },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.md },
  invoiceCard: { backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  invoiceHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  invoiceNumber: { ...typography.body, color: colors.text, fontWeight: "600" },
  invoiceSupplier: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  invoiceFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md },
  invoiceAmount: { ...typography.body, color: colors.primary, fontWeight: "600" },
  invoiceDue: { ...typography.caption, color: colors.textMuted },
  factoringBtn: { backgroundColor: colors.primary, borderRadius: radii.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, marginTop: spacing.md, alignItems: "center" },
  factoringBtnText: { ...typography.body, color: "#fff", fontWeight: "600" },
  financingCard: { backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  financingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  financingInvoice: { ...typography.body, color: colors.text, fontWeight: "600" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statusText: { ...typography.caption, color: colors.textSecondary },
  financingDetails: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md },
  detailLabel: { ...typography.caption, color: colors.textMuted },
  detailValue: { ...typography.body, color: colors.text, fontWeight: "500", marginTop: 2 },
  partnerText: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.sm },
  applicationRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  appInfo: { flex: 1 },
  appFacility: { ...typography.body, color: colors.text, fontWeight: "600" },
  appAmount: { ...typography.bodySmall, color: colors.primary, marginTop: 2 },
  appDate: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  emptyCard: { backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.xl, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  emptyText: { ...typography.body, color: colors.textMuted },
});
