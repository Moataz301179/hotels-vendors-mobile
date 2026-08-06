import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { useNotificationStore } from "@/store/notifications";
import { Bell, Check, Trash2, Package, FileText, CreditCard } from "lucide-react-native";
import { fmtDate } from "@/utils/format";

const categoryIcons = {
  order: Package,
  invoice: FileText,
  payment: CreditCard,
  factoring: Bell,
  system: Bell,
};

const categoryColors = {
  order: colors.info,
  invoice: colors.primary,
  payment: colors.success,
  factoring: colors.warning,
  system: colors.textMuted,
};

export default function NotificationCenterScreen({ navigation }: any) {
  const { notifications, unreadCount, markRead, markAllRead, clearAll, loadFromStorage } = useNotificationStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = useCallback(async () => {
    await loadFromStorage();
    setLoading(false);
  }, [loadFromStorage]);

  const handleMarkAllRead = () => {
    Alert.alert("Mark All Read", "Mark all notifications as read?", [
      { text: "Cancel", style: "cancel" },
      { text: "Mark All", onPress: () => markAllRead() },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert("Clear All", "Remove all notifications?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => clearAll() },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    const IconComponent = categoryIcons[item.category as keyof typeof categoryIcons] || Bell;
    const iconColor = categoryColors[item.category as keyof typeof categoryColors] || colors.textMuted;

    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.read && styles.unreadCard]}
        onPress={() => {
          if (!item.read) markRead(item.id);
          if (item.orderId && navigation.navigate) {
            navigation.navigate("OrderDetail", { id: item.orderId });
          } else if (item.invoiceId) {
            navigation.navigate("InvoiceDetail", { id: item.invoiceId });
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.notifLeft}>
          <View style={[styles.iconWrap, { backgroundColor: iconColor + "22" }]}>
            <IconComponent size={18} color={iconColor} />
          </View>
          <View style={styles.notifContent}>
            <Text style={[styles.notifTitle, !item.read && styles.unreadTitle]}>{item.title}</Text>
            {item.body ? <Text style={styles.notifBody}>{item.body}</Text> : null}
            <Text style={styles.notifTime}>{fmtDate(item.createdAt)}</Text>
          </View>
        </View>
        {!item.read ? <View style={styles.unreadDot} /> : null}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 ? (
          <Text style={styles.unreadBadge}>{unreadCount} unread</Text>
        ) : null}
      </View>

      {notifications.length > 0 ? (
        <>
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAllRead} style={styles.actionBtn}>
              <Check size={16} color={colors.textSecondary} />
              <Text style={styles.actionBtnText}>Mark all as read</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity onPress={handleClearAll} style={[styles.actionBtn, styles.clearBtn]}>
            <Trash2 size={16} color={colors.error} />
            <Text style={[styles.actionBtnText, { color: colors.error }]}>Clear all</Text>
          </TouchableOpacity>

          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <View style={[styles.container, styles.center]}>
          <Bell size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptySub}>You'll see order updates, invoice reminders, and payment confirmations here.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  center: { justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  title: { ...typography.h2, color: colors.text },
  unreadBadge: { ...typography.caption, color: colors.primary, backgroundColor: colors.primaryMuted, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.full },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: spacing.xs,
    paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: radii.md, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  clearBtn: { alignItems: "flex-start" },
  actionBtnText: { ...typography.bodySmall, color: colors.textSecondary },
  list: { gap: spacing.sm, paddingBottom: spacing.xxxl },
  notifCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  unreadCard: { borderWidth: 1, borderColor: colors.primary + "44" },
  notifLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: spacing.sm },
  iconWrap: { width: 36, height: 36, borderRadius: radii.full, alignItems: "center", justifyContent: "center" },
  notifContent: { flex: 1 },
  notifTitle: { ...typography.body, color: colors.textSecondary, fontWeight: "400" },
  unreadTitle: { color: colors.text, fontWeight: "600" },
  notifBody: { ...typography.bodySmall, color: colors.textMuted, marginTop: 2 },
  notifTime: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  emptyTitle: { ...typography.h3, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm },
  emptySub: { ...typography.bodySmall, color: colors.textMuted, textAlign: "center", paddingHorizontal: spacing.xl },
});
