/**
 * Login Screen
 */

import React, { useEffect, useState } from "react";
import { useAuth, useSignIn, useSSO } from "@clerk/expo";
import { makeRedirectUri } from "expo-auth-session";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { useAuthStore } from "@/store/auth";
import { Panel, Led, MechButton, MONO } from "@/components/ops";
import HovinWordmark from "@/components/HovinWordmark";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen({ navigation }: any) {
  const redirectUrl = makeRedirectUri({ scheme: "hovin", path: "sso-callback" });
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const insets = useSafeAreaInsets();
  const loadUser = useAuthStore((state) => state.loadUser);
  const { isSignedIn } = useAuth();
  const { signIn, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();
  type PendingSignUp = NonNullable<Awaited<ReturnType<typeof startSSOFlow>>["signUp"]>;
  type PendingSso = { signUp: PendingSignUp; setActive: NonNullable<Awaited<ReturnType<typeof startSSOFlow>>["setActive"]> };
  const [pendingSso, setPendingSso] = useState<PendingSso | null>(null);
  const isLoading = fetchStatus === "fetching";

  useEffect(() => {
    if (isSignedIn) void loadUser();
  }, [isSignedIn, loadUser]);

  if (isSignedIn) {
    return <View style={[styles.container, { justifyContent: "center", alignItems: "center", padding: spacing.xl }]}><ActivityIndicator color={colors.primaryDark} /><Text style={[styles.byline, { marginTop: spacing.md }]}>Restoring your workspace…</Text></View>;
  }

  const handleLogin = async () => {
    if (!identifier.trim() || !password) {
      Alert.alert("Error", "Email, username and password are required");
      return;
    }
    try {
      const { error } = await signIn.password({
        identifier: identifier.trim(),
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

  const handleGoogle = async () => {
    try {
      if (isSignedIn) {
        await loadUser();
        return;
      }
      const result = await startSSOFlow({ strategy: "oauth_google", redirectUrl });
      if (result.createdSessionId) {
        await result.setActive?.({ session: result.createdSessionId });
      } else if (result.signIn?.status === "complete" && result.signIn.createdSessionId) {
        // Clerk may return the existing completed session when the provider
        // account is already signed in on the simulator.
        await result.setActive?.({ session: result.signIn.createdSessionId });
      } else if (result.signUp?.status === "missing_requirements") {
        if (!result.setActive) throw new Error("Could not activate the completed Clerk session");
        setPendingSso({ signUp: result.signUp, setActive: result.setActive });
      } else if (result.authSessionResult?.type !== "cancel" && result.authSessionResult?.type !== "dismiss") throw new Error("Google sign-in did not complete");
    } catch (err: any) {
      if (isSignedIn || /already signed in/i.test(String(err?.message))) {
        await loadUser();
        return;
      }
      Alert.alert("Google sign-in failed", err.message || "Please try again");
    }
  };

  const handleApple = async () => {
    try {
      if (isSignedIn) {
        await loadUser();
        return;
      }
      const result = await startSSOFlow({ strategy: "oauth_apple", redirectUrl });
      if (result.createdSessionId) {
        await result.setActive?.({ session: result.createdSessionId });
      } else if (result.signIn?.status === "complete" && result.signIn.createdSessionId) {
        await result.setActive?.({ session: result.signIn.createdSessionId });
      } else if (result.signUp?.status === "missing_requirements") {
        if (!result.setActive) throw new Error("Could not activate the completed Clerk session");
        setPendingSso({ signUp: result.signUp, setActive: result.setActive });
      } else if (result.authSessionResult?.type !== "cancel" && result.authSessionResult?.type !== "dismiss") throw new Error("Apple sign-in did not complete");
    } catch (err: any) {
      if (isSignedIn || /already signed in/i.test(String(err?.message))) {
        await loadUser();
        return;
      }
      Alert.alert("Apple sign-in failed", err.message || "Please try again");
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
      await loadUser();
    } catch (err: any) {
      Alert.alert("Sign-up incomplete", err.message || "Please check your username and try again");
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
            <Led color={colors.gold} />
            <HovinWordmark size={30} />
          </View>
          <Text style={styles.tagline}>Digital Procurement Hub</Text>
          <Text style={styles.byline}>A Hotels Vendors application</Text>
        </View>

        <View style={styles.form}>
          <Panel tag="AUTH // HOVIN" style={{ padding: spacing.lg }}>
            <Text style={styles.label}>Email or username</Text>
            <TextInput
              style={styles.input}
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="you@hotel.com or username"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
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

            <TouchableOpacity style={styles.googleButton} onPress={handleGoogle} disabled={isLoading}>
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>
            {Platform.OS === "ios" && (
              <TouchableOpacity style={styles.googleButton} onPress={handleApple} disabled={isLoading}>
                <Text style={styles.googleText}>Continue with Apple</Text>
              </TouchableOpacity>
            )}

            {pendingSso && (
              <View style={{ marginTop: spacing.md }}>
                <Text style={styles.label}>Choose a username to finish sign-up</Text>
                <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="At least 6 characters" placeholderTextColor={colors.textMuted} autoCapitalize="none" autoCorrect={false} />
                <TouchableOpacity style={styles.googleButton} onPress={completeSsoSignUp} disabled={isLoading}>
                  <Text style={styles.googleText}>Finish account setup</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.link}>Don't have an account? Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
              <Text style={styles.linkMuted}>Forgot Password?</Text>
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
  googleButton: { borderWidth: 1, borderColor: colors.borderLight, borderRadius: radii.sm, padding: spacing.lg, alignItems: "center", marginTop: spacing.sm },
  googleText: { color: colors.text, fontWeight: "600", fontSize: 15 },
  link: { color: colors.primary, textAlign: "center", marginTop: spacing.lg, ...typography.bodySmall },
  linkMuted: { color: colors.textMuted, textAlign: "center", marginTop: spacing.sm, ...typography.bodySmall },
  trust: { ...typography.caption, color: colors.textMuted, textAlign: "center", marginTop: spacing.xxl, fontFamily: MONO as any, letterSpacing: 1 },
  mechLoading: { borderRadius: radii.sm - 2, padding: spacing.lg, alignItems: "center", marginTop: spacing.md },
});
