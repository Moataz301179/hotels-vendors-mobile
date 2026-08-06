import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { fintechAPI } from "@/api";
import { fmtMoney, fmtDate } from "@/utils/format";
import { ChevronRight, Package, TrendingUp, BarChart3 } from "lucide-react-native";

interface FactoringInvoice {
  id: string;
  invoiceNumber: string;
  total: string;
  currency: string;
  dueDate: string;
  etaStatus: string;
  factoringStatus: string;
  hotel: { name: string; city: string; tier: string };
  supplier: { name: string; city: string };
}

interface CreditLine {
  id: string;
  hotelName: string;
  status: string;
  recommendedLimit: number;
  creditScore: number;
  createdAt: string;
}

interface BestOffer {
  partnerId: string;
  partnerName: string;
  advanceRate: number;
  discountRate: number;
  netPayable: number;
  estimatedDisbursementDate: string;
}

interface FactoringOffer {
  invoiceId: string;
  invoiceNumber: string;
  amount: string;
  currency: string;
  dueDate: string;
  bestOffer?: BestOffer;
  allOffers: BestOffer[];
}

type TabType = "marketplace" | "credit-lines";

export default function MarketplaceScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>("marketplace");
  const [invoices, setInvoices] = useState<FactoringInvoice[]>([]);
  const [creditLines, setCreditLines] = useState<CreditLine[]>([]);
  const [offers, setOffers] = useState<FactoringOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState<Record<string, boolean>>({});

  const loadMarketplace = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fintechAPI.marketplaceOffers();
      if (data.success && data.data?.invoices) {
        setInvoices(data.data.invoices);
      }
    } catch {
      Alert.alert("Error", "Failed to load marketplace");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCreditLines = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await fintechAPI.getCreditLines();
      if (data.success && data.data) {
        setCreditLines(data.data);
      }
    } catch {
      Alert.alert("Error", "Failed to load credit lines");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInquire = useCallback(async (invoiceId: string) => {
    setLoadingOffers((prev) => ({ ...prev, [invoiceId]: true }));
    try {
      const { data } = await fintechAPI.inquireFactoring(invoiceId);
      if (data.success && data.data) {
        navigation.navigate("FactoringOfferDetail", {
          invoiceId,
          bestOffer: data.data.bestOffer,
          allOffers: data.data.allOffers,
        });
      } else {
        Alert.alert("Error", data.error || "Inquiry failed");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.error || "Inquiry failed");
    } finally {
      setLoadingOffers((prev) => ({ ...prev, [invoiceId]: false }));
    }
  }, [navigation]);

  useEffect(() => {
    if (activeTab === "marketplace") loadMarketplace();
    else loadCreditLines();
  }, [activeTab, loadMarketplace, loadCreditLines]);

  const renderInvoice = ({ item }: { item: FactoringInvoice }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => handleInquire(item.id)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.iconWrap}>
          <Package size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Invoice {item.invoiceNumber}</Text>
          <Text style={styles.cardSubtitle}>{item.hotel.name} • {item.hotel.city}</Text>
        </View>
        <ChevronRight size={16} color={colors.textMuted} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>{fmtMoney(Number(item.total))} {item.currency}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Due: {fmtDate(item.dueDate)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: colors.warning + "22" }]}>
            <Text style={[styles.statusText, { color: colors.warning }]}>{item.factoringStatus}</Text>
          </View>
        </View>
      </View>

      {loadingOffers[item.id] && (
        <View style={styles.offerOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.offerText}>Finding offers…</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCreditLine = ({ item }: { item: CreditLine }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => Alert.alert("Credit Line", `Status: ${item.status}\nRecommended Limit: ${fmtMoney(item.recommendedLimit)}\nCredit Score: ${item.creditScore}`)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconWrap, { backgroundColor: colors.success + "22" }]}>
          <BarChart3 size={20} color={colors.success} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{item.hotelName}</Text>
          <Text style={styles.cardSubtitle}>Credit Line Application</Text>
        </View>
        <ChevronRight size={16} color={colors.textMuted} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Recommended Limit</Text>
          <Text style={styles.amountValue}>{fmtMoney(item.recommendedLimit)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>Score: {item.creditScore}/100</Text>
          <View style={[styles.statusBadge, { backgroundColor: colors.success + "22" }]}>
            <Text style={[styles.statusText, { color: colors.success }]}>{item.status.replace("_", " ")}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <TrendingUp size={48} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>
        {activeTab === "marketplace"
          ? "No invoices available for factoring"
          : "No credit line applications found"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Factoring Marketplace</Text>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "marketplace" && styles.tabActive]}
            onPress={() => setActiveTab("marketplace")}
          >
            <Text style={[styles.tabText, activeTab === "marketplace" && styles.tabTextActive]}>Marketplace</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "credit-lines" && styles.tabActive]}
            onPress={() => setActiveTab("credit-lines")}
          >
            <Text style={[styles.tabText, activeTab === "credit-lines" && styles.tabTextActive]}>Credit Lines</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList<any>
          data={activeTab === "marketplace" ? invoices : creditLines}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: any }) =>
            activeTab === "marketplace" ? renderInvoice({ item: item as FactoringInvoice }) : renderCreditLine({ item: item as CreditLine })
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.lg, paddingBottom: 0 },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
  tabBar: {
    flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md,
  },
  tab: {
    flex: 1, paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: radii.md, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    alignItems: "center",
  },
  tabActive: { backgroundColor: colors.primaryMuted + "33", borderColor: colors.primary + "44" },
  tabText: { ...typography.bodySmall, color: colors.textSecondary },
  tabTextActive: { color: colors.primary, fontWeight: "600" },
  list: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: radii.full,
    backgroundColor: colors.primaryMuted + "22", alignItems: "center", justifyContent: "center",
  },
  cardTitle: { ...typography.h3, color: colors.text },
  cardSubtitle: { ...typography.bodySmall, color: colors.textMuted, marginTop: 2 },
  cardBody: { gap: spacing.sm },
  amountRow: { flexDirection: "row", justifyContent: "space-between" },
  amountLabel: { ...typography.bodySmall, color: colors.textMuted },
  amountValue: { ...typography.h3, color: colors.primary, fontWeight: "600" },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metaText: { ...typography.caption, color: colors.textMuted },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.full },
  statusText: { ...typography.caption, textTransform: "uppercase", fontWeight: "600" },
  offerOverlay: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.bg, borderRadius: radii.md, padding: spacing.sm, marginTop: spacing.sm,
    borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  offerText: { ...typography.caption, color: colors.textSecondary },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { alignItems: "center", paddingVertical: spacing.xxxl, gap: spacing.md },
  emptyTitle: { ...typography.body, color: colors.textMuted, textAlign: "center" },
});
