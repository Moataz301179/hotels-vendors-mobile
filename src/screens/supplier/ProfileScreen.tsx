/**
 * Profile & Settings — account, company, security, notifications, logout
 */

import React, { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { useAuthStore } from "@/store/auth";
import { orderStatusLabel } from "@/utils/format";
import {
  User, Phone, Mail, Building, MapPin, FileText, Shield, Bell, Key, LogOut,
  ChevronRight, Star,
} from "lucide-react-native";

function Field({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  if (!value) return null;
  return (
    <View style={styles.field}>
      <View style={styles.fieldLeft}>
        {icon}
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
       <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name || "S").charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.rowGap}>
            <Text style={styles.name}>{user?.name || "User"}</Text>
            <Text style={styles.sub}>{user?.email}</Text>
          </View>
        </View>
        <ChevronRight size={20} color={colors.textMuted} />
      </View>

<Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.card}>
        <Field label="Full name" value={user?.name} icon={<User size={16} color={colors.textMuted} />} />
        <Field label="Mobile" value={user?.phone} icon={<Phone size={16} color={colors.textMuted} />} />
        <Field label="Email" value={user?.email} icon={<Mail size={16} color={colors.textMuted} />} />
        <Field label="Account type" value={user?.platformRole ? orderStatusLabel(user.platformRole) : undefined} icon={<Shield size={16} color={colors.textMuted} />} />
      </View>

      <Text style={styles.sectionTitle}>Company</Text>
      <View style={styles.card}>
        <Field label="Company" value={user?.companyName} icon={<Building size={16} color={colors.textMuted} />} />
        <Field label="Registered name" value={user?.supplier?.legalName} icon={<Building size={16} color={colors.textMuted} />} />
        <Field label="City" value={user?.supplier?.city} icon={<MapPin size={16} color={colors.textMuted} />} />
        <Field label="Governorate" value={user?.supplier?.governorate} />
        <Field label="Tax ID" value={user?.supplier?.taxId} icon={<FileText size={16} color={colors.textMuted} />} />
        <Field label="Supplier status" value={user?.supplier?.status} icon={<Shield size={16} color={colors.textMuted} />} />
        <Field label="Tier" value={user?.supplier?.tier} icon={<Star size={16} color={colors.primary} />} />
      </View>

      <Text style={styles.sectionTitle}>Notifications</Text>
      <View style={styles.card}>
        <View style={styles.switchRow}>
          <View style={styles.switchLeft}>
            <Bell size={16} color={colors.textSecondary} />
            <Text style={styles.switchLabel}>Push notifications</Text>
          </View>
          <Switch value={pushEnabled} onValueChange={setPushEnabled} trackColor={{ true: colors.primary }} />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchLeft}>
            <Mail size={16} color={colors.textSecondary} />
            <Text style={styles.switchLabel}>Email updates</Text>
          </View>
          <Switch value={emailEnabled} onValueChange={setEmailEnabled} trackColor={{ true: colors.primary }} />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.switchLeft}>
            <Phone size={16} color={colors.textSecondary} />
            <Text style={styles.switchLabel}>SMS alerts</Text>
          </View>
          <Switch value={smsEnabled} onValueChange={setSmsEnabled} trackColor={{ true: colors.primary }} />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Security</Text>
      <TouchableOpacity style={styles.card} onPress={() => Alert.alert("Change password", "Coming in the next build")}>
        <View style={styles.rowBetween}>
          <View style={styles.switchLeft}>
            <Key size={16} color={colors.textSecondary} />
            <Text style={styles.linkText}>Change password</Text>
          </View>
          <ChevronRight size={16} color={colors.textMuted} />
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.card}>
        <Field label="App" value="INVO Vendor" />
        <Field label="Version" value="1.0.0" />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <View style={styles.rowBetween}>
          <View style={styles.switchLeft}>
            <LogOut size={18} color={colors.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </View>
          <ChevronRight size={16} color={colors.error} />
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg, marginBottom: spacing.xl },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.bg, fontSize: 24, fontWeight: "700" },
  name: { ...typography.h3, color: colors.text },
  sub: { ...typography.bodySmall, color: colors.textMuted, marginTop: 2 },
  sectionTitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm, marginTop: spacing.lg, textTransform: "uppercase", letterSpacing: 0.6 },
  card: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.md },
  field: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  fieldLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  fieldLabel: { ...typography.bodySmall, color: colors.textMuted },
  fieldValue: { ...typography.bodySmall, color: colors.text, flex: 1, textAlign: "right" },
  rowGap: { gap: 2 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  switchLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  switchLabel: { ...typography.body, color: colors.text },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  linkText: { ...typography.body, color: colors.primary },
  logoutBtn: { backgroundColor: colors.error + "22", borderWidth: 1, borderColor: colors.error + "66", borderRadius: radii.md, padding: spacing.lg, alignItems: "center", marginTop: spacing.lg },
  logoutText: { color: colors.error, fontWeight: "600", fontSize: 16 },
});
