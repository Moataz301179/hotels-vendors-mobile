import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, RefreshControl,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { olivAPI } from "@/api";
import { fmtDate, fmtMoney } from "@/utils/format";
import { Clock, CheckCircle, AlertCircle, FileText, Building, Calendar, DollarSign, RefreshCw } from "lucide-react-native";

interface OnboardingRecord {
  id: string;
  olivStatus: string;
  partnerId: string;
  olivKycSubmittedAt?: string | null;
  olivKycApprovedAt?: string | null;
  olivCreditApprovedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Facility {
  id: string;
  status: string;
  approvedAt?: string | null;
  expiresAt?: string | null;
  creditLimitEgp: number;
  availableEgp: number;
}

interface SupplierInfo {
  id: string;
  name: string;
  taxId?: string | null;
}

interface KycStatusData {
  hasOnboarding: boolean;
  status: string;
  hasCompletedKyc: boolean;
  canProceed: boolean;
  supplier: SupplierInfo | null;
  facility: Facility | null;
  onboarding: OnboardingRecord | null;
}

const STATUS_STEPS = [
  { key: "PENDING", label: "Application Submitted" },
  { key: "UNDER_REVIEW", label: "Under Review" },
  { key: "KYC_SUBMITTED", label: "KYC Submitted" },
  { key: "KYC_APPROVED", label: "KYC Approved" },
  { key: "ACTIVE", label: "Active" },
];

export default function OlivKycStatusScreen({ navigation }: any) {
  const [data, setData] = useState<KycStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const { data: res } = await olivAPI.getKycStatus();
      if (res.success && res.data) setData(res.data);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load KYC status");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <AlertCircle size={48} color={colors.error} />
        <Text style={styles.emptyTitle}>Unable to load KYC status</Text>
        <TouchableOpacity onPress={fetchStatus}>
          <Text style={styles.retryLink}>Tap to retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data.hasOnboarding) {
    return (
      <View style={styles.center}>
        <FileText size={48} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>No KYC application found</Text>
        <Text style={styles.emptyDesc}>
          You haven't submitted an Oliv financing application yet.
        </Text>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate("OlivActivation")}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>Start Oliv Application</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStepIdx = STATUS_STEPS.findIndex((s) =>
    data.status.includes(s.key) || data.status === s.key
  );
  const effectiveStep = currentStepIdx >= 0 ? currentStepIdx : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStatus(); }} tintColor={colors.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Oliv Financing</Text>
        <Text style={styles.subtitle}>KYC & Credit Facility Status</Text>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: data.hasCompletedKyc ? colors.success : data.status === "REJECTED" ? colors.error : colors.pending }]} />
          <Text style={styles.statusLabel}>
            {data.hasCompletedKyc ? "Approved" : data.status === "REJECTED" ? "Rejected" : "In Progress"}
          </Text>
        </View>
        {data.supplier?.taxId ? <Text style={styles.taxId}>Tax ID: {data.supplier.taxId}</Text> : null}
      </View>

      <Text style={styles.sectionTitle}>Progress</Text>
      <View style={styles.stepsCard}>
        {STATUS_STEPS.map((step, idx) => {
          const reached = idx <= effectiveStep;
          const isCurrent = idx === effectiveStep;
          return (
            <View key={step.key} style={styles.stepRow}>
              <View style={[styles.stepCircle, { backgroundColor: reached ? colors.success : colors.border }]}>
                {reached ? <CheckCircle size={14} color={colors.bg} /> : <Clock size={14} color={colors.textMuted} />}
              </View>
              <Text style={[styles.stepLabel, { color: reached ? colors.text : colors.textMuted, fontWeight: isCurrent ? "600" : "400" }]}>
                {step.label}
              </Text>
              {idx < STATUS_STEPS.length - 1 && (
                <View style={[styles.stepLine, { backgroundColor: idx < effectiveStep ? colors.success : colors.border }]} />
              )}
            </View>
          );
        })}
      </View>

      {data.onboarding ? (
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Application Details</Text>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <FileText size={16} color={colors.textMuted} />
              <Text style={styles.rowLabel}>Application ID</Text>
            </View>
            <Text style={styles.rowValue}>{data.onboarding.id.slice(0, 8)}</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Building size={16} color={colors.textMuted} />
              <Text style={styles.rowLabel}>Partner ID</Text>
            </View>
            <Text style={styles.rowValue}>{data.onboarding.partnerId}</Text>
          </View>
          {data.onboarding.olivKycSubmittedAt ? (
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Calendar size={16} color={colors.textMuted} />
                <Text style={styles.rowLabel}>KYC Submitted</Text>
              </View>
              <Text style={styles.rowValue}>{fmtDate(data.onboarding.olivKycSubmittedAt)}</Text>
            </View>
          ) : null}
          {data.onboarding.olivKycApprovedAt ? (
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <CheckCircle size={16} color={colors.textMuted} />
                <Text style={styles.rowLabel}>KYC Approved</Text>
              </View>
              <Text style={styles.rowValue}>{fmtDate(data.onboarding.olivKycApprovedAt)}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Calendar size={16} color={colors.textMuted} />
              <Text style={styles.rowLabel}>Last Updated</Text>
            </View>
            <Text style={styles.rowValue}>{fmtDate(data.onboarding.updatedAt)}</Text>
          </View>
        </View>
      ) : null}

      {data.facility ? (
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Credit Facility</Text>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <DollarSign size={16} color={colors.textMuted} />
              <Text style={styles.rowLabel}>Credit Limit</Text>
            </View>
            <Text style={styles.rowValue}>{fmtMoney(data.facility.creditLimitEgp)}</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <DollarSign size={16} color={colors.textMuted} />
              <Text style={styles.rowLabel}>Available</Text>
            </View>
            <Text style={[styles.rowValue, { color: colors.success }]}>{fmtMoney(data.facility.availableEgp)}</Text>
          </View>
          {data.facility.expiresAt ? (
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Calendar size={16} color={colors.textMuted} />
                <Text style={styles.rowLabel}>Expires</Text>
              </View>
              <Text style={styles.rowValue}>{fmtDate(data.facility.expiresAt)}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Credit Facility</Text>
          <Text style={styles.emptyText}>
            {data.hasCompletedKyc
              ? "Facility will be assigned once Oliv completes credit approval."
              : "Complete KYC to unlock your credit facility."}
          </Text>
        </View>
      )}

      {!data.canProceed && data.hasCompletedKyc === false && (
        <TouchableOpacity
          style={styles.reApplyBtn}
          onPress={() => navigation.navigate("OlivActivation")}
          activeOpacity={0.8}
        >
          <RefreshCw size={18} color={colors.bg} style={{ marginRight: spacing.sm }} />
          <Text style={styles.reApplyBtnText}>Return to Oliv Application</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", gap: spacing.md, padding: spacing.lg },
  header: { marginBottom: spacing.xl },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  statusCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xs },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusLabel: { ...typography.h3, color: colors.text, fontWeight: "600" },
  taxId: { ...typography.caption, color: colors.textMuted },
  sectionTitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm, textTransform: "uppercase", letterSpacing: 0.6 },
  stepsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  stepRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, position: "relative" },
  stepCircle: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", zIndex: 2 },
  stepLabel: { ...typography.bodySmall, flex: 1 },
  stepLine: {
    position: "absolute",
    left: 12,
    top: 24,
    bottom: -spacing.sm,
    width: 2,
    zIndex: 1,
  },
  infoCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  rowLabel: { ...typography.bodySmall, color: colors.textMuted },
  rowValue: { ...typography.bodySmall, color: colors.text, flex: 1.6, textAlign: "right" },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: "center", paddingVertical: spacing.sm },
  emptyTitle: { ...typography.h2, color: colors.text, textAlign: "center" },
  emptyDesc: { ...typography.body, color: colors.textSecondary, textAlign: "center" },
  retryLink: { color: colors.primary, ...typography.bodySmall },
  actionBtn: { backgroundColor: colors.primary, borderRadius: radii.md, padding: spacing.lg, alignItems: "center", marginTop: spacing.md },
  actionBtnText: { color: colors.bg, fontWeight: "600", fontSize: 16 },
  reApplyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  reApplyBtnText: { color: colors.bg, fontWeight: "600", fontSize: 16 },
});
