/**
 * Referral Screen — mutual hotel↔supplier onboarding.
 * Users share an invite link via WhatsApp or copy it.
 * Hybrid incentive: suppliers earn 48h factoring access, hotels earn feature unlocks.
 */

import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Share, Clipboard, Alert, Linking } from "react-native";
import { Users, Copy, MessageCircle, CheckCircle2, Gift, Factory, Hotel, Zap, ArrowRight } from "lucide-react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { useAuthStore } from "@/store/auth";

const WHATSAPP_URL = "https://wa.me/?text=";

export default function ReferralScreen() {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  // Build the referral link with the user's tenant/code
  const referralCode = user?.tenantId || user?.id || "INVO";
  const referralLink = `https://www.hotelsvendors.com/register?ref=${referralCode}`;

  const userRole = user?.role || "SUPPLIER";
  const isHotel = userRole === "HOTEL";

  // Incentive copy based on role
  const incentives = isHotel
    ? [
        { icon: Zap, title: "Unlock Advanced Approvals", desc: "Onboard 5 suppliers → unlock multi-tier approval matrix" },
        { icon: Gift, title: "Network Credits", desc: "Both you and the supplier earn credits toward feature unlocks" },
        { icon: CheckCircle2, title: "Better Pricing", desc: "More suppliers on the platform = more competitive quotes for you" },
      ]
    : [
        { icon: Zap, title: "48h Cash-Out Access", desc: "Bring a hotel onboard → unlock priority 48h factoring access" },
        { icon: Gift, title: "Network Credits", desc: "Both you and the hotel earn credits toward premium features" },
        { icon: Factory, title: "Direct Orders", desc: "Hotels you refer get linked to your catalog automatically" },
      ];

  const shareMessage = isHotel
    ? `I'm using HotelsVendors to manage our hotel procurement — join as a supplier to receive direct orders from us. 48h cash-out available. Register here: ${referralLink}`
    : `I supply hotels through HotelsVendors INVO app — join as a hotel buyer to get competitive pricing from verified suppliers. Register here: ${referralLink}`;

  const handleWhatsAppShare = async () => {
    const url = `${WHATSAPP_URL}${encodeURIComponent(shareMessage)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      // Fallback to native share sheet
      await handleNativeShare();
    }
  };

  const handleNativeShare = async () => {
    try {
      await Share.share({ message: shareMessage, title: "Join HotelsVendors" });
    } catch {}
  };

  const handleCopyLink = () => {
    Clipboard.setString(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert("Copied", "Referral link copied to clipboard");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxxl * 3 }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconWrap}>
          <Users size={28} color={colors.primary} />
        </View>
        <Text style={styles.title}>Invite {isHotel ? "Suppliers" : "Hotels"}</Text>
        <Text style={styles.subtitle}>
          {isHotel
            ? "Onboard suppliers you already buy from — both of you earn rewards"
            : "Invite hotels you already serve — both of you earn rewards"}
        </Text>
      </View>

      {/* Incentive cards */}
      <Text style={styles.sectionTitle}>Your Rewards</Text>
      {incentives.map((inc, i) => (
        <View key={i} style={styles.incentiveCard}>
          <View style={styles.incentiveIconWrap}>
            <inc.icon size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.incentiveTitle}>{inc.title}</Text>
            <Text style={styles.incentiveDesc}>{inc.desc}</Text>
          </View>
        </View>
      ))}

      {/* Referral link */}
      <Text style={styles.sectionTitle}>Your Referral Link</Text>
      <View style={styles.linkCard}>
        <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="tail">{referralLink}</Text>
        <TouchableOpacity onPress={handleCopyLink} style={styles.copyBtn}>
          {copied ? <CheckCircle2 size={16} color={colors.success} /> : <Copy size={16} color={colors.primary} />}
          <Text style={[styles.copyText, { color: copied ? colors.success : colors.primary }]}>{copied ? "Copied" : "Copy"}</Text>
        </TouchableOpacity>
      </View>

      {/* Share buttons */}
      <View style={styles.shareRow}>
        <TouchableOpacity onPress={handleWhatsAppShare} style={styles.whatsappBtn}>
          <MessageCircle size={20} color="#fff" />
          <Text style={styles.whatsappText}>Share via WhatsApp</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={handleNativeShare} style={styles.shareMoreBtn}>
        <Text style={styles.shareMoreText}>More sharing options</Text>
        <ArrowRight size={14} color={colors.primary} />
      </TouchableOpacity>

      {/* How it works */}
      <Text style={styles.sectionTitle}>How It Works</Text>
      <View style={styles.stepsCard}>
        {[
          { n: "1", t: "Share your link", d: `Send to ${isHotel ? "suppliers" : "hotels"} via WhatsApp or copy-paste anywhere` },
          { n: "2", t: "They register", d: `Your contact signs up — automatically linked to your network` },
          { n: "3", t: "Both earn rewards", d: "Credits + feature unlocks activate when they place their first order" },
        ].map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{step.n}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{step.t}</Text>
              <Text style={styles.stepDesc}>{step.d}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: "center", paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  headerIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  title: { ...typography.h1, color: colors.text, textAlign: "center" },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginTop: spacing.xs },
  sectionTitle: { ...typography.h3, color: colors.text, marginHorizontal: spacing.xl, marginTop: spacing.xl, marginBottom: spacing.sm },
  incentiveCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginHorizontal: spacing.xl, marginBottom: spacing.sm },
  incentiveIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center", marginRight: spacing.md },
  incentiveTitle: { ...typography.body, color: colors.text, fontWeight: "600" },
  incentiveDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  linkCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginHorizontal: spacing.xl, marginBottom: spacing.md },
  linkText: { ...typography.caption, color: colors.textSecondary, flex: 1, fontFamily: "monospace" },
  copyBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.primaryMuted },
  copyText: { ...typography.label, fontWeight: "600" },
  shareRow: { paddingHorizontal: spacing.xl, marginBottom: spacing.sm },
  whatsappBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#25D366", borderRadius: radii.lg, paddingVertical: spacing.lg },
  whatsappText: { ...typography.body, color: "#fff", fontWeight: "700" },
  shareMoreBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: spacing.md },
  shareMoreText: { ...typography.body, color: colors.primary, fontWeight: "600" },
  stepsCard: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginHorizontal: spacing.xl },
  stepRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: spacing.md },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginRight: spacing.md, marginTop: 2 },
  stepNumberText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  stepTitle: { ...typography.body, color: colors.text, fontWeight: "600" },
  stepDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});