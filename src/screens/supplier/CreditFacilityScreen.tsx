import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { fintechAPI } from "@/api";

interface PaymentScheduleItem {
  id: string;
  dueDate: string;
  amount: number;
  status: string;
}

interface FacilityData {
  creditLimit: number;
  utilized: number;
  available: number;
  interestRate: number;
  advanceRate: number;
  discountRate: number;
  paymentSchedule: PaymentScheduleItem[];
}

export default function CreditFacilityScreen({ navigation }: any) {
  const [facility, setFacility] = useState<FacilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFacility = useCallback(async () => {
    try {
      const { data } = await fintechAPI.getCreditFacility();
      if (data.success && data.data) {
        setFacility(data.data);
      }
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchFacility(); }, [fetchFacility]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!facility) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyIcon}>🏦</Text>
        <Text style={styles.emptyTitle}>No Credit Facility Yet</Text>
        <Text style={styles.emptyDesc}>
          Activate Oliv Financing to unlock your credit line
        </Text>
        <TouchableOpacity
          style={styles.activateCta}
          onPress={() => navigation.navigate("OlivActivation")}
          activeOpacity={0.8}
        >
          <Text style={styles.activateCtaText}>Activate Oliv Financing</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const utilizationPct = facility.creditLimit > 0
    ? (facility.utilized / facility.creditLimit) * 100
    : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchFacility(); }}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.gaugeCard}>
        <Text style={styles.gaugeLabel}>Credit Utilization</Text>
        <View style={styles.gaugeTrack}>
          <View style={[styles.gaugeFill, { width: `${Math.min(utilizationPct, 100)}%` }]} />
        </View>
        <Text style={styles.gaugePct}>{utilizationPct.toFixed(1)}% utilized</Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>EGP {facility.creditLimit.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Credit Limit</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: colors.warning }]}>
            EGP {facility.utilized.toLocaleString()}
          </Text>
          <Text style={styles.metricLabel}>Utilized</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: colors.success }]}>
            EGP {facility.available.toLocaleString()}
          </Text>
          <Text style={styles.metricLabel}>Available</Text>
        </View>
      </View>

      <View style={styles.ratesCard}>
        <Text style={styles.sectionTitle}>Rates & Terms</Text>
        <View style={styles.rateRow}>
          <Text style={styles.rateLabel}>Interest Rate</Text>
          <Text style={styles.rateValue}>{facility.interestRate}%</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.rateRow}>
          <Text style={styles.rateLabel}>Advance Rate</Text>
          <Text style={styles.rateValue}>{facility.advanceRate}%</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.rateRow}>
          <Text style={styles.rateLabel}>Discount Rate</Text>
          <Text style={styles.rateValue}>{facility.discountRate}%</Text>
        </View>
      </View>

      <View style={styles.scheduleSection}>
        <Text style={styles.sectionTitle}>Payment Schedule</Text>
        {facility.paymentSchedule.length === 0 ? (
          <Text style={styles.emptySchedule}>No upcoming payments</Text>
        ) : (
          facility.paymentSchedule.map((item) => (
            <View key={item.id} style={styles.scheduleCard}>
              <View style={styles.scheduleHeader}>
                <Text style={styles.scheduleDate}>
                  {new Date(item.dueDate).toLocaleDateString()}
                </Text>
                <View
                  style={[
                    styles.scheduleBadge,
                    { backgroundColor: item.status === "PAID" ? colors.success + "20" : colors.pending + "20" },
                  ]}
                >
                  <Text
                    style={[
                      styles.scheduleBadgeText,
                      { color: item.status === "PAID" ? colors.success : colors.pending },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.scheduleAmount}>
                EGP {item.amount.toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl * 2 },
  centered: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", padding: spacing.lg, gap: spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { ...typography.h2, color: colors.text, textAlign: "center" },
  emptyDesc: { ...typography.body, color: colors.textSecondary, textAlign: "center" },
  activateCta: { backgroundColor: colors.primary, borderRadius: radii.lg, paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl, marginTop: spacing.md },
  activateCtaText: { ...typography.h3, color: colors.bg, fontWeight: "600" },
  gaugeCard: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  gaugeLabel: { ...typography.label, color: colors.textSecondary, textTransform: "uppercase", marginBottom: spacing.md },
  gaugeTrack: { height: 12, backgroundColor: colors.bgInput, borderRadius: radii.full, overflow: "hidden" },
  gaugeFill: { height: "100%", backgroundColor: colors.primary, borderRadius: radii.full },
  gaugePct: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.sm },
  metricsRow: { flexDirection: "row", gap: spacing.md },
  metricCard: { flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  metricValue: { ...typography.h3, color: colors.text, fontWeight: "600" },
  metricLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  ratesCard: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { ...typography.label, color: colors.textSecondary, textTransform: "uppercase", marginBottom: spacing.md },
  rateRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm },
  rateLabel: { ...typography.body, color: colors.textSecondary },
  rateValue: { ...typography.body, color: colors.text, fontWeight: "600" },
  divider: { height: 1, backgroundColor: colors.border },
  scheduleSection: { gap: spacing.md },
  scheduleCard: { backgroundColor: colors.bgCard, borderRadius: radii.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  scheduleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scheduleDate: { ...typography.bodySmall, color: colors.textSecondary },
  scheduleBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.full },
  scheduleBadgeText: { ...typography.label, textTransform: "uppercase" },
  scheduleAmount: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  emptySchedule: { ...typography.bodySmall, color: colors.textMuted, textAlign: "center", paddingVertical: spacing.lg },
});
