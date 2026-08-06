/**
 * Hotel Home Screen — Quick overview
 */

import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from "react-native";
import { ShoppingBasket, ClipboardList, FileText } from "lucide-react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { useAuthStore } from "@/store/auth";
import { hotelAPI } from "@/api";

export default function HotelHomeScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const [spend, setSpend] = useState<{ monthly: number; pending: number; delivered: number }>({ monthly: 0, pending: 0, delivered: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const fetchSpend = async () => {
    try {
      const { data } = await hotelAPI.spend();
      if (data.success && data.data) setSpend(data.data);
    } catch {} finally { setRefreshing(false); }
  };

  useEffect(() => { fetchSpend(); }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSpend(); }} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{user?.name || "Hotel"}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        {[
          { label: "Monthly Spend", value: `EGP ${spend.monthly.toLocaleString()}`, color: colors.primary },
          { label: "Pending Orders", value: spend.pending, color: colors.warning },
          { label: "Delivered", value: spend.delivered, color: colors.success },
        ].map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      {[
        { label: "Browse Catalog", icon: ShoppingBasket, screen: "CatalogTab" },
        { label: "My Orders", icon: ClipboardList, screen: "OrdersTab" },
        { label: "Invoices", icon: FileText, screen: "InvoicesTab" },
      ].map((action) => (
        <TouchableOpacity key={action.screen} style={styles.actionCard} onPress={() => navigation.navigate(action.screen)}>
          <View style={styles.actionIconWrap}>
            <action.icon size={22} color={colors.primary} />
          </View>
          <Text style={styles.actionLabel}>{action.label}</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, paddingBottom: spacing.xxxl * 4 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xl },
  greeting: { ...typography.body, color: colors.textSecondary },
  name: { ...typography.h1, color: colors.text },
  logoutBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.full, backgroundColor: colors.error + "20" },
  logoutText: { color: colors.error, ...typography.label },
  statsRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.xxl },
  statCard: { flex: 1, backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  statValue: { ...typography.h2, fontWeight: "600" },
  statLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs, textAlign: "center" },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  actionCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  actionIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center", marginRight: spacing.md },
  actionLabel: { ...typography.body, color: colors.text, flex: 1 },
  actionArrow: { ...typography.h2, color: colors.textMuted },
});
