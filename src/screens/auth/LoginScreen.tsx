/**
 * Login Screen
 */

import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { useAuthStore } from "@/store/auth";

export default function LoginScreen({ navigation }: any) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert("Error", "Email/mobile and password are required");
      return;
    }
    try {
      await login(identifier.trim(), password);
    } catch (err: any) {
      Alert.alert("Login Failed", err.message || "Invalid credentials");
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <Image source={require("../../../assets/images/auth-bg.jpg")} style={styles.bgImage} resizeMode="cover" />
      <View style={styles.bgOverlay} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>INVO</Text>
          <Text style={styles.tagline}>Digital Procurement Hub</Text>
          <Text style={styles.byline}>A Hotels Vendors application</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email or Mobile Number</Text>
          <TextInput
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="you@hotel.com or +20 1X0 XXX XXXX"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.link}>Don't have an account? Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("OtpLogin")}>
            <Text style={styles.linkMuted}>Sign in with mobile & OTP</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.trust}>Secure sign-in · ETA-compliant invoicing</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  bgImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(10,14,26,0.88)" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: spacing.xl },
  header: { alignItems: "center", marginBottom: spacing.xxxl },
  logo: { ...typography.h1, color: colors.primary, fontSize: 32, letterSpacing: 6 },
  tagline: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  byline: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm, letterSpacing: 0.4 },
  form: { gap: spacing.md },
  label: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    color: colors.text,
    fontSize: 15,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonText: { color: colors.bg, fontWeight: "600", fontSize: 16 },
  link: { color: colors.primary, textAlign: "center", marginTop: spacing.lg, ...typography.bodySmall },
  linkMuted: { color: colors.textMuted, textAlign: "center", marginTop: spacing.sm, ...typography.bodySmall },
  trust: { ...typography.caption, color: colors.textMuted, textAlign: "center", marginTop: spacing.xxl },
});
