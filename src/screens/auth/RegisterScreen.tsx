/**
 * Register Screen
 */

import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { useAuthStore } from "@/store/auth";
import type { UserRole } from "@/types";
import { isValidEgyptianPhone, normalizePhone } from "@/utils/phone";
import PhoneInput from "@/components/PhoneInput";

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: "HOTEL", label: "Hotel Buyer", desc: "Browse & order supplies" },
  { value: "SUPPLIER", label: "Vendor", desc: "Sell products to hotels" },
];

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("HOTEL");
  const { isLoading } = useAuthStore();

  const handleSendCode = () => {
    if (!name || !password) {
      Alert.alert("Error", "Full name and password are required");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }
    if (!isValidEgyptianPhone(phone)) {
      Alert.alert("Invalid Number", "Enter a valid Egyptian mobile number, e.g. 0101 234 5678");
      return;
    }
    navigation.navigate("Otp", {
      mode: "register",
      phone: normalizePhone(phone),
      name,
      email: email.trim() || undefined,
      password,
      role,
    });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <Image source={require("../../../assets/images/auth-bg.jpg")} style={styles.bgImage} resizeMode="cover" />
      <View style={styles.bgOverlay} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>

        <Text style={styles.roleTitle}>I'm joining as</Text>
        <View style={styles.roleRow}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.roleCard, role === r.value && styles.roleActive]}
              onPress={() => setRole(r.value)}
            >
              <Text style={[styles.roleLabel, role === r.value && styles.roleLabelActive]}>{r.label}</Text>
              <Text style={[styles.roleDesc, role === r.value && styles.roleDescActive]}>{r.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textMuted} placeholder="John Doe" />

          <Text style={styles.label}>Mobile Number</Text>
          <PhoneInput value={phone} onChangeText={setPhone} fontSize={15} />

          <Text style={styles.label}>Email (optional)</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholderTextColor={colors.textMuted} placeholder="you@company.com" keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholderTextColor={colors.textMuted} placeholder="Min 8 characters" secureTextEntry />

          <TouchableOpacity style={styles.button} onPress={handleSendCode} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Verify Mobile & Continue</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  bgImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(10,14,26,0.88)" },
  scroll: { flexGrow: 1, padding: spacing.xl, paddingTop: 60 },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.xl },
  roleTitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm },
  roleRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.xl },
  roleCard: {
    flex: 1, padding: spacing.lg, borderRadius: radii.lg,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
  },
  roleActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  roleLabel: { ...typography.h3, color: colors.text, marginBottom: spacing.xs },
  roleLabelActive: { color: colors.primary },
  roleDesc: { ...typography.caption, color: colors.textMuted },
  roleDescActive: { color: colors.textSecondary },
  form: { gap: spacing.md },
  label: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs },
  input: { backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.lg, color: colors.text, fontSize: 15 },
  button: { backgroundColor: colors.primary, borderRadius: radii.md, padding: spacing.lg, alignItems: "center", marginTop: spacing.md },
  buttonText: { color: colors.bg, fontWeight: "600", fontSize: 16 },
  link: { color: colors.primary, textAlign: "center", marginTop: spacing.lg, ...typography.bodySmall },
});
