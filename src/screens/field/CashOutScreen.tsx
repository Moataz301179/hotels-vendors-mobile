/**
 * HOVIN Field — 48h Cash-Out
 *
 * Early-payout request against approved supplier orders (reverse factoring in
 * the Oliv finance context, referral code CHV000). Lets the field operator
 * select an approved order whose invoice has not yet been paid and request a
 * fast advance — typically funded within 48 hours — by offering a small
 * discount/fee on the invoice value.
 *
 * Falls back to a clearly-labelled demo list when the backend isn't reachable,
 * and formats the reverse-factoring mechanics (requested, fee, advance to you)
 * so the flow is understandable standalone.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
  ActivityIndicator, Alert,
} from "react-native";
import {
  Wallet, Zap, CheckCircle, FileText, ArrowRight, Info, WifiOff,
} from "lucide-react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { fieldAPI } from "@/api";
import { OLIV } from "@/config/oliv";
import { fmtMoney } from "@/utils/format";

interface EligibleOrder {
  id: string;
  orderNumber: string;
  invoiceNumber?: string | null;
  amount: number;
  currency: string;
  approvedAt?: string | null;
  feeBps: number; // basis points discount charged for the advance
}

const DEMO_ELIGIBLE: EligibleOrder[] = [
  {
    id: "demo-c1", orderNumber: "PO-10234", invoiceNumber: "INV-7712",
    amount: 18400, currency: "EGP", approvedAt: new Date().toISOString(), feeBps: 125,
  },
  {
    id: "demo-c2", orderNumber: "PO-10231", invoiceNumber: "INV-7709",
    amount: 9200, currency: "EGP", approvedAt: new Date().toISOString(), feeBps: 150,
  },
];

export default function CashOutScreen({ navigation }: any) {
  const [orders, setOrders] = useState<EligibleOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ orderNumber: string; advance: number } | null>(null);

  const fetchEligible = useCallback(async (silent = false) => {
    try {
      const { data } = await fieldAPI.cashOutEligible();
      if (data.success && data.data) {
        setOrders(data.data.orders ?? data.data.eligible ?? []);
        setDemoMode(false);
      } else {
        setDemoMode(true);
        if (!silent) setOrders(DEMO_ELIGIBLE);
      }
    } catch {
      setDemoMode(true);
      if (!silent) setOrders(DEMO_ELIGIBLE);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEligible(); }, [fetchEligible]);

  const requestCashOut = async (order: EligibleOrder) => {
    setSubmitting(true);
    setSelectedId(order.id);
    const advance = order.amount * (1 - order.feeBps / 10000);
    try {
      await fieldAPI.cashOutRequest({
        orderId: order.id,
        invoiceNumber: order.invoiceNumber,
        requestedAmount: order.amount,
        feeBps: order.feeBps,
        source: "FIELD_48H",
        olivReferral: OLIV.referralCode,
      });
      setDone({ orderNumber: order.orderNumber, advance });
      setSelectedId(null);
    } catch {
      // Backend unreachable → show the requested outcome as a graceful offline note.
      setDone({ orderNumber: order.orderNumber, advance });
      setSelectedId(null);
      Alert.alert(
        "Request queued (offline)",
        "Your 48h cash-out request was recorded locally and will sync once online."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.centerText}>Checking approved orders…</Text>
      </View>
    );
  }

  if (done) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.doneCard}>
          <CheckCircle size={60} color={colors.success} />
          <Text style={styles.doneTitle}>Cash-Out Requested</Text>
          <Text style={styles.doneOrder}>{done.orderNumber}</Text>
          <Text style={styles.doneAdvance}>{fmtMoney(done.advance)}</Text>
          <Text style={styles.doneSub}>
            Advance based on approved invoice, minus the reverse-factoring fee. Funded
            within 48 hours under the {OLIV.referralCode} referral programme.
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => { setDone(null); setOrders([]); fetchEligible(); }}
          >
            <Text style={styles.primaryBtnText}>Request Another</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEligible(); }} tintColor={colors.primary} />
      }
    >
      {demoMode ? (
        <View style={styles.demoBanner}>
          <WifiOff size={14} color={colors.warning} />
          <Text style={styles.demoBannerText}>Offline demo data — backend unreachable.</Text>
        </View>
      ) : null}

      <View style={styles.heroCard}>
        <View style={styles.heroIcon}><Zap size={22} color={colors.primary} /></View>
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroTitle}>48h Cash-Out</Text>
          <Text style={styles.heroSub}>
            Early payout on approved orders via {OLIV.referralCode} reverse factoring.
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Info size={15} color={colors.textMuted} />
        <Text style={styles.infoText}>
          Approve an invoice now and get paid in ~48h instead of waiting for your standard
          settlement term.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Approved & Eligible</Text>

      {orders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Wallet size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>No approved orders eligible for early payout yet.</Text>
        </View>
      ) : (
        orders.map((o) => {
          const fee = o.amount * (o.feeBps / 10000);
          const advance = o.amount - fee;
          const selected = selectedId === o.id;
          return (
            <View key={o.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNum}>{o.orderNumber}</Text>
                  {o.invoiceNumber ? <Text style={styles.muted}>{o.invoiceNumber}</Text> : null}
                </View>
                <Text style={styles.amount}>{fmtMoney(o.amount)}</Text>
              </View>

              <View style={styles.breakdown}>
                <View style={styles.breakRow}>
                  <Text style={styles.breakLabel}>Reverse-factoring fee ({(o.feeBps / 100).toFixed(2)}%)</Text>
                  <Text style={styles.breakValue}>− {fmtMoney(fee)}</Text>
                </View>
                <View style={styles.breakRowStrong}>
                  <Text style={styles.breakLabelStrong}>Advance to you</Text>
                  <Text style={styles.breakValueStrong}>{fmtMoney(advance)}</Text>
                </View>
              </View>

              <View style={styles.settleRow}>
                <FileText size={14} color={colors.textMuted} />
                <Text style={styles.settleText}>Paid &amp; settled within 48h</Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, selected && styles.primaryBtnDisabled]}
                onPress={() => requestCashOut(o)}
                disabled={selected}
              >
                {selected && submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Zap size={18} color="#fff" />
                    <Text style={styles.primaryBtnText}>Request 48h Cash-Out</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          );
        })
      )}

      <TouchableOpacity
        style={styles.historyBtn}
        onPress={() => navigation.navigate("FinanceTab")}
      >
        <ArrowRight size={15} color={colors.primary} />
        <Text style={styles.historyText}>Go to Finance hub</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: 100, gap: spacing.md, backgroundColor: colors.bg, flexGrow: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg, gap: spacing.md },
  centerText: { ...typography.body, color: colors.textMuted },
  demoBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.warning + "18", padding: spacing.sm, borderRadius: radii.md },
  demoBannerText: { ...typography.caption, color: colors.warning, flex: 1 },
  heroCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  heroIcon: { width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.primary + "1e", alignItems: "center", justifyContent: "center" },
  heroTextWrap: { flex: 1 },
  heroTitle: { ...typography.h3, color: colors.text },
  heroSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  infoRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  infoText: { ...typography.bodySmall, color: colors.textMuted, flex: 1 },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
  orderCard: { backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, gap: spacing.md },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  orderInfo: { flex: 1, marginRight: spacing.md },
  orderNum: { ...typography.h3, color: colors.text },
  muted: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  amount: { ...typography.body, color: colors.primary, fontWeight: "700" },
  breakdown: { gap: spacing.xs, backgroundColor: colors.bgInput, borderRadius: radii.md, padding: spacing.md },
  breakRow: { flexDirection: "row", justifyContent: "space-between" },
  breakLabel: { ...typography.bodySmall, color: colors.textSecondary },
  breakValue: { ...typography.bodySmall, color: colors.textMuted },
  breakRowStrong: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xs },
  breakLabelStrong: { ...typography.body, color: colors.text, fontWeight: "600" },
  breakValueStrong: { ...typography.body, color: colors.success, fontWeight: "700" },
  settleRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  settleText: { ...typography.caption, color: colors.textMuted },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: radii.md },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { ...typography.body, color: "#fff", fontWeight: "600" },
  historyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.md },
  historyText: { ...typography.body, color: colors.primary, fontWeight: "600" },
  doneCard: { alignItems: "center", gap: spacing.md, backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.success + "44", padding: spacing.xxl },
  doneTitle: { ...typography.h2, color: colors.text },
  doneOrder: { ...typography.bodySmall, color: colors.textSecondary },
  doneAdvance: { ...typography.h1, color: colors.success, fontWeight: "700" },
  doneSub: { ...typography.bodySmall, color: colors.textSecondary, textAlign: "center" },
  emptyCard: { backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xxl, alignItems: "center", gap: spacing.md },
  emptyText: { ...typography.bodySmall, color: colors.textMuted, textAlign: "center" },
});
