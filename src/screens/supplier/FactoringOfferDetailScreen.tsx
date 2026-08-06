import React, { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { fintechAPI } from "@/api";
import { fmtMoney } from "@/utils/format";
import { TrendingUp, Check, X, Clock, FileText, ChevronRight } from "lucide-react-native";

interface Offer {
  partnerId: string;
  partnerName: string;
  advanceRate: number;
  discountRate: number;
  netPayable: number;
  estimatedDisbursementDate: string;
}

export default function FactoringOfferDetailScreen({ navigation, route }: any) {
  const { invoiceId, bestOffer, allOffers } = route.params;
  const [funding, setFunding] = useState(false);

  const handleAccept = useCallback(async (offer: Offer) => {
    Alert.alert(
      "Accept Offer",
      `Accept ${offer.partnerName}'s offer?\nAdvance: ${Math.round(offer.advanceRate * 100)}%\nDiscount: ${Math.round(offer.discountRate * 100)}%\nNet Payable: ${fmtMoney(offer.netPayable)}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          style: "default",
          onPress: async () => {
            setFunding(true);
            try {
              const { data } = await fintechAPI.triggerFunding(invoiceId, offer.partnerId);
              if (data.success && data.data) {
                Alert.alert(
                  "Success",
                  `Funding submitted! Estimated disbursement: ${new Date(data.data.estimatedDisbursementDate).toLocaleDateString()}`,
                  [{ text: "OK", onPress: () => navigation.popToTop() }],
                );
              } else {
                Alert.alert("Error", data.error || "Funding failed");
              }
            } catch (e: any) {
              Alert.alert("Error", e?.response?.data?.error || "Funding failed");
            } finally {
              setFunding(false);
            }
          },
        },
      ]
    );
  }, [invoiceId, navigation]);

  const renderOffer = (offer: Offer, isBest: boolean) => (
    <TouchableOpacity
      key={offer.partnerId}
      style={[styles.offerCard, isBest && styles.bestOfferCard]}
      onPress={() => handleAccept(offer)}
      activeOpacity={0.7}
      disabled={funding}
    >
      <View style={styles.offerHeader}>
        <View style={styles.partnerInfo}>
          <TrendingUp size={20} color={isBest ? colors.primary : colors.textMuted} />
          <View>
            <Text style={[styles.partnerName, isBest && styles.bestPartnerName]}>{offer.partnerName}</Text>
            {isBest ? (
              <View style={styles.bestBadge}>
                <Text style={styles.bestBadgeText}>Best Offer</Text>
              </View>
            ) : null}
          </View>
        </View>
        <ChevronRight size={16} color={colors.textMuted} />
      </View>

      <View style={styles.offerDetails}>
        <View style={styles.offerRow}>
          <Text style={styles.offerLabel}>Advance Rate</Text>
          <Text style={styles.offerValue}>{Math.round(offer.advanceRate * 100)}%</Text>
        </View>
        <View style={styles.offerRow}>
          <Text style={styles.offerLabel}>Discount Rate</Text>
          <Text style={styles.offerValue}>{Math.round(offer.discountRate * 100)}%</Text>
        </View>
        <View style={styles.offerRow}>
          <Text style={styles.offerLabel}>Net Payable</Text>
          <Text style={[styles.offerValue, styles.netPayable]}>{fmtMoney(offer.netPayable)}</Text>
        </View>
        <View style={styles.offerRow}>
          <Text style={styles.offerLabel}>Estimated Disbursement</Text>
          <Text style={styles.offerValue}>
            {new Date(offer.estimatedDisbursementDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </Text>
        </View>
      </View>

      {isBest ? (
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => handleAccept(offer)}
          disabled={funding}
          activeOpacity={0.8}
        >
          {funding ? (
            <ActivityIndicator color={colors.bg} size="small" />
          ) : (
            <>
              <Check size={18} color={colors.bg} style={{ marginRight: spacing.xs }} />
              <Text style={styles.acceptBtnText}>Accept Offer & Fund</Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <FileText size={24} color={colors.textMuted} />
        <Text style={styles.title}>Factoring Offers</Text>
      </View>

      <Text style={styles.sectionTitle}>Invoice #{invoiceId}</Text>

      {bestOffer ? (
        <>
          <Text style={styles.sectionSubtitle}>Recommended Offer</Text>
          {renderOffer(bestOffer, true)}
        </>
      ) : (
        <View style={styles.noOffer}>
          <Clock size={24} color={colors.textMuted} />
          <Text style={styles.noOfferText}>No offers available for this invoice yet.</Text>
        </View>
      )}

      {allOffers && allOffers.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>All Offers ({allOffers.length})</Text>
          {allOffers.map((offer: Offer) =>
            offer.partnerId !== bestOffer?.partnerId ? renderOffer(offer, false) : null
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.xl },
  title: { ...typography.h2, color: colors.text },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  sectionSubtitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm },
  offerCard: {
    backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  bestOfferCard: { borderColor: colors.primary + "44", borderWidth: 2 },
  offerHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md,
  },
  partnerInfo: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  partnerName: { ...typography.h3, color: colors.text },
  bestPartnerName: { color: colors.primary },
  bestBadge: {
    backgroundColor: colors.primaryMuted + "33",
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    borderRadius: radii.full, marginTop: 2,
  },
  bestBadgeText: { ...typography.caption, color: colors.primary, fontWeight: "600" },
  offerDetails: { gap: spacing.sm, marginBottom: spacing.md },
  offerRow: { flexDirection: "row", justifyContent: "space-between" },
  offerLabel: { ...typography.bodySmall, color: colors.textMuted },
  offerValue: { ...typography.bodySmall, color: colors.text },
  netPayable: { color: colors.success, fontWeight: "600" },
  acceptBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: spacing.xs, backgroundColor: colors.success,
    borderRadius: radii.md, paddingVertical: spacing.md,
  },
  acceptBtnText: { color: colors.bg, fontWeight: "600", fontSize: 15 },
  noOffer: {
    alignItems: "center", paddingVertical: spacing.xxl, gap: spacing.md,
    backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border,
  },
  noOfferText: { ...typography.body, color: colors.textMuted, textAlign: "center" },
});
