/**
 * Login Screen
 */

import React, { useState } from "react";
import { useSignIn } from "@clerk/expo";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { useAuthStore } from "@/store/auth";
import { Panel, Plate, Led, MechButton, MONO } from "@/components/ops";

export default function LoginScreen({ navigation }: any) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const loadUser = useAuthStore((state) => state.loadUser);
  const { signIn, fetchStatus } = useSignIn();
  const isLoading = fetchStatus === "fetching";

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert("Error", "Email/mobile and password are required");
      return;
    }
    try {
      const { error } = await signIn.password({
        emailAddress: identifier.trim(),
        password,
      });
      if (error) {
        throw new Error(error.message || "Invalid credentials");
      }
      if (signIn.status !== "complete") {
        throw new Error("Additional verification is required to continue.");
      }
      await signIn.finalize();
      await loadUser();
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
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
            <Led color={colors.gold} />
            <Text style={styles.logoWord}>HOVIN</Text>
          </View>
          <Text style={styles.tagline}>Digital Procurement Hub</Text>
          <Text style={styles.byline}>A Hotels Vendors application</Text>
        </View>

                <View style={styles.form}>
          <Panel tag="AUTH // HOVIN" style={{ padding: spacing.lg }}>
            <Text style={styles.label}>Email or Mobile Number</Text>
            <TextInput
              style={styles.input}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="you@hotel.com"
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

            {isLoading ? (
              <View style={[styles.mechLoading, { backgroundColor: colors.primary }]}>
                <ActivityIndicator color={colors.bg} />
              </View>
            ) : (
              <MechButton onPress={handleLogin} style={{ marginTop: spacing.md }}>
                <Text style={styles.buttonText}>SIGN IN</Text>
              </MechButton>
            )}

            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.link}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
              <Text style={styles.linkMuted}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("OtpLogin")}>
              <Text style={styles.linkMuted}>Sign in with mobile & OTP</Text>
            </TouchableOpacity>
          </Panel>
        </View>

        <Text style={styles.trust}>SECURE SIGN-IN // ETA-COMPLIANT HOVIN</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  bgImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(11,15,20,0.9)" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: spacing.xl },
  header: { alignItems: "center", marginBottom: spacing.xxl },
  logoWord: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 3,
    color: colors.text,
    fontFamily: "PlusJakartaSans_700Bold",
  },
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
  trust: { ...typography.caption, color: colors.textMuted, textAlign: "center", marginTop: spacing.xxl, fontFamily: MONO as any, letterSpacing: 1 },
  mechLoading: { borderRadius: radii.sm - 2, padding: spacing.lg, alignItems: "center", marginTop: spacing.md },
});
