/**
 * FactoringCashOutWidget — INVO Mobile
 * One-tap "Request 48h Payout" for suppliers
 *
 * Shows available invoice balance, calculated factoring fee (1.5–3%),
 * and net payout amount. Tapping triggers the factoring request.
 */

import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { fintechAPI } from "@/api";
import { fmtMoney } from "@/utils/format";
import { Banknote, Clock, TrendingUp, ChevronRight } from "lucide-react-native";

interface FactoringCashOutProps {
  /** Total available invoices that can be factored */
  availableBalance: number;
  /** Number of invoices eligible */
  invoiceCount: number;
  /** Current factoring fee percentage (from server) */
  feeRate?: number;
  /** Currency */
  currency?: string;
  /** Called after successful factoring request */
  onSuccess?: () => void;
}

export function FactoringCashOutWidget({
  availableBalance,
  invoiceCount,
  feeRate = 2.1,
  currency = "EGP",
  onSuccess,
}: FactoringCashOutProps) {
  const [loading, setLoading] = useState(false);

  const fee = availableBalance * (feeRate / 100);
  const netPayout = availableBalance - fee;

  const handleRequestPayout = async () => {
    if (invoiceCount === 0) {
      Alert.alert("No invoices", "You need verified invoices to request a payout.");
      return;
    }

    setLoading(true);
    try {
      // This calls the factoring/inquire endpoint which checks all eligible invoices
      const { data } = await fintechAPI.marketplaceOffers();
      if (data.success) {
        Alert.alert(
          "Payout Requested",
          `EGP ${fmtMoney(netPayout)} will be disbursed within 48 hours. Fee: ${feeRate}% (EGP ${fmtMoney(fee)})`,
          [{ text: "OK", onPress: () => onSuccess?.() }]
        );
      } else {
        Alert.alert("Error", data.error || "Payout request failed");
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Banknote size={20} color="#10B981" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Factoring Cash-Out</Text>
          <Text style={styles.subtitle}>48-hour supplier payout via Oliv</Text>
        </View>
        <View style={styles.badge}>
          <Clock size={10} color="#10B981" />
          <Text style={styles.badgeText}>48h</Text>
        </View>
      </View>

      {/* Balance */}
      <View style={styles.balanceRow}>
        <View style={styles.balanceCol}>
          <Text style={styles.balanceLabel}>Available</Text>
          <Text style={styles.balanceAmount}>
            {fmtMoney(availableBalance)} {currency}
          </Text>
          <Text style={styles.balanceCount}>{invoiceCount} invoice{invoiceCount !== 1 ? "s" : ""}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.balanceCol}>
          <Text style={styles.balanceLabel}>Net Payout (est.)</Text>
          <Text style={[styles.balanceAmount, { color: "#10B981" }]}>
            {fmtMoney(netPayout)} {currency}
          </Text>
          <Text style={styles.feeInfo}>
            {feeRate}% fee · {fmtMoney(fee)} {currency}
          </Text>
        </View>
      </View>

      {/* Action button */}
      <TouchableOpacity
        style={[styles.payoutBtn, loading && styles.payoutBtnDisabled]}
        onPress={handleRequestPayout}
        disabled={loading || invoiceCount === 0}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <TrendingUp size={18} color="#fff" />
            <Text style={styles.payoutBtnText}>
              Request 48h Payout
            </Text>
            <ChevronRight size={16} color="#fff" />
          </>
        )}
      </TouchableOpacity>

      {/* Compliance footer */}
      <View style={styles.compliance}>
        <Clock size={10} color={colors.textMuted} />
        <Text style={styles.complianceText}>FRA compliant · Non-recourse factoring · Powered by Oliv</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    fontWeight: "600",
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  badgeText: {
    ...typography.caption,
    color: "#10B981",
    fontWeight: "600",
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
  },
  balanceCol: {
    flex: 1,
  },
  balanceLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceAmount: {
    ...typography.h2,
    color: colors.text,
    fontWeight: "700",
    marginTop: 2,
  },
  balanceCount: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  divider: {
    width: 1,
    height: 50,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  feeInfo: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  payoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: "#10B981",
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  payoutBtnDisabled: {
    opacity: 0.5,
  },
  payoutBtnText: {
    ...typography.body,
    color: colors.bg,
    fontWeight: "700",
    fontSize: 15,
  },
  compliance: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  complianceText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
});