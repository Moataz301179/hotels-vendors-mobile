/**
 * Register Screen
 */

import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { useAuthStore } from "@/store/auth";
import type { UserRole } from "@/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth, useSignUp, useSSO } from "@clerk/expo";
import { makeRedirectUri } from "expo-auth-session";
import HovinWordmark from "@/components/HovinWordmark";

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: "HOTEL", label: "Hotel Buyer", desc: "Browse & order supplies" },
  { value: "SUPPLIER", label: "Vendor", desc: "Sell products to hotels" },
];

export default function RegisterScreen({ navigation }: any) {
  const redirectUrl = makeRedirectUri({ scheme: "hovin", path: "sso-callback" });
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("HOTEL");
  const insets = useSafeAreaInsets();
  const { isLoading, loadUser } = useAuthStore();
  const { isSignedIn } = useAuth();
  const { signUp, fetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();
  type PendingSignUp = NonNullable<Awaited<ReturnType<typeof startSSOFlow>>["signUp"]>;
  type PendingSso = { signUp: PendingSignUp; setActive: NonNullable<Awaited<ReturnType<typeof startSSOFlow>>["setActive"]> };
  const [pendingSso, setPendingSso] = useState<PendingSso | null>(null);

  useEffect(() => {
    if (isSignedIn) void loadUser();
  }, [isSignedIn, loadUser]);

  if (isSignedIn) {
    return <View style={[styles.container, { justifyContent: "center", alignItems: "center", padding: spacing.xl }]}><ActivityIndicator color={colors.primaryDark} /><Text style={[styles.brandTagline, { marginTop: spacing.md }]}>Restoring your workspace…</Text></View>;
  }

  const handleSendCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();
    const nameParts = name.trim().split(/\s+/).filter(Boolean);
    if (!nameParts.length || !normalizedUsername || !normalizedEmail || !password) {
      Alert.alert("Required details", "Name, username, email address and password are required.");
      return;
    }
    if (normalizedUsername.length < 6 || normalizedUsername.length > 64) {
      Alert.alert("Username not accepted", "Choose a username between 6 and 64 characters.");
      return;
    }
    if (password.length < 15) {
      Alert.alert("Password too short", "Use at least 15 characters for your password.");
      return;
    }
    try {
      const result = await signUp.create({
        emailAddress: normalizedEmail,
        username: normalizedUsername,
        password,
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(" ") || undefined,
        unsafeMetadata: { platformRole: role },
      });
      if (result.error) throw new Error(result.error.message || "Could not create account");
      navigation.navigate("Otp", { mode: "register", email: normalizedEmail, role });
    } catch (err: any) {
      Alert.alert("Sign-up failed", err.message || "Could not create account");
    }
  };

  const handleGoogle = async () => {
    try {
      if (isSignedIn) {
        await loadUser();
        return;
      }
      const result = await startSSOFlow({ strategy: "oauth_google", redirectUrl, unsafeMetadata: { platformRole: role } });
      if (result.createdSessionId) {
        await result.setActive?.({ session: result.createdSessionId });
      } else if (result.signIn?.status === "complete" && result.signIn.createdSessionId) {
        await result.setActive?.({ session: result.signIn.createdSessionId });
      } else if (result.signUp?.status === "missing_requirements") {
        if (!result.setActive) throw new Error("Could not activate the completed Clerk session");
        setPendingSso({ signUp: result.signUp, setActive: result.setActive });
      } else if (result.authSessionResult?.type !== "cancel" && result.authSessionResult?.type !== "dismiss") {
        throw new Error("Google sign-up did not complete");
      }
    } catch (err: any) {
      if (isSignedIn || /already signed in/i.test(String(err?.message))) {
        await loadUser();
        return;
      }
      Alert.alert("Google sign-up failed", err.message || "Please try again");
    }
  };

  const handleApple = async () => {
    try {
      if (isSignedIn) {
        await loadUser();
        return;
      }
      const result = await startSSOFlow({ strategy: "oauth_apple", redirectUrl, unsafeMetadata: { platformRole: role } });
      if (result.createdSessionId) {
        await result.setActive?.({ session: result.createdSessionId });
      } else if (result.signIn?.status === "complete" && result.signIn.createdSessionId) {
        await result.setActive?.({ session: result.signIn.createdSessionId });
      } else if (result.signUp?.status === "missing_requirements") {
        if (!result.setActive) throw new Error("Could not activate the completed Clerk session");
        setPendingSso({ signUp: result.signUp, setActive: result.setActive });
      } else if (result.authSessionResult?.type !== "cancel" && result.authSessionResult?.type !== "dismiss") {
        throw new Error("Apple sign-up did not complete");
      }
    } catch (err: any) {
      if (isSignedIn || /already signed in/i.test(String(err?.message))) {
        await loadUser();
        return;
      }
      Alert.alert("Apple sign-up failed", err.message || "Please try again");
    }
  };

  const completeSsoSignUp = async () => {
    if (!pendingSso) return;
    const normalizedUsername = username.trim();
    if (normalizedUsername.length < 6 || normalizedUsername.length > 64) {
      Alert.alert("Username not accepted", "Choose a username between 6 and 64 characters.");
      return;
    }
    try {
      const updated = await pendingSso.signUp.update({ username: normalizedUsername });
      if (updated.status !== "complete" || !updated.createdSessionId) {
        Alert.alert("More details needed", `Clerk still requires: ${updated.missingFields.join(", ") || "additional verification"}.`);
        return;
      }
      await pendingSso.setActive({ session: updated.createdSessionId });
      setPendingSso(null);
      await useAuthStore.getState().loadUser();
    } catch (err: any) {
      Alert.alert("Sign-up incomplete", err.message || "Please check your username and try again");
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]} keyboardShouldPersistTaps="handled">
        <View nativeID="clerk-captcha" style={styles.captchaMount} />
        <View style={styles.brand}>
          <HovinWordmark size={30} />
          <Text style={styles.brandTagline}>Digital Procurement Hub</Text>
        </View>
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

        <TouchableOpacity style={styles.googleButton} onPress={handleGoogle} disabled={fetchStatus === "fetching"}>
          {fetchStatus === "fetching" ? <ActivityIndicator color={colors.text} /> : <Text style={styles.googleText}>Continue with Google</Text>}
        </TouchableOpacity>
        {Platform.OS === "ios" && (
          <TouchableOpacity style={styles.googleButton} onPress={handleApple} disabled={fetchStatus === "fetching"}>
            <Text style={styles.googleText}>Continue with Apple</Text>
          </TouchableOpacity>
        )}
        {pendingSso && (
          <View style={styles.form}>
            <Text style={styles.label}>Choose a username to finish sign-up</Text>
            <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholderTextColor={colors.textMuted} placeholder="At least 6 characters" autoCapitalize="none" autoCorrect={false} />
            <TouchableOpacity style={styles.button} onPress={completeSsoSignUp} disabled={fetchStatus === "fetching"}>
              <Text style={styles.buttonText}>Finish account setup</Text>
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.orLabel}>or create an account with your verified email</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textMuted} placeholder="John Doe" />

          <Text style={styles.label}>Username</Text>
          <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholderTextColor={colors.textMuted} placeholder="At least 6 characters" autoCapitalize="none" autoCorrect={false} />

          <Text style={styles.label}>Email address</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholderTextColor={colors.textMuted} placeholder="you@company.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />

          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholderTextColor={colors.textMuted} placeholder="At least 15 characters" secureTextEntry autoCapitalize="none" autoCorrect={false} />

          <TouchableOpacity style={styles.button} onPress={handleSendCode} disabled={isLoading || fetchStatus === "fetching"}>
            {isLoading || fetchStatus === "fetching" ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>Verify email & continue</Text>}
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
  captchaMount: { minHeight: 0 },
  container: { flex: 1, backgroundColor: colors.bg },
  bgImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  scroll: { flexGrow: 1, padding: spacing.xl, paddingTop: 60 },
  title: { ...typography.h1, color: colors.text, marginBottom: spacing.xl },
  brand: { alignItems: "center", marginBottom: spacing.xl },
  brandTagline: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
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
  googleButton: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: radii.md, padding: spacing.lg, alignItems: "center", marginTop: spacing.sm },
  googleText: { color: colors.text, fontWeight: "600", fontSize: 15 },
  orLabel: { ...typography.caption, color: colors.textMuted, textAlign: "center", marginVertical: spacing.md },
  link: { color: colors.primary, textAlign: "center", marginTop: spacing.lg, ...typography.bodySmall },
});
