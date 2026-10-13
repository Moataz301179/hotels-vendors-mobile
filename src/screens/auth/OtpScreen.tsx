/**
 * OTP Screen — verify the email address required by the active Clerk instance
 *
 * Verification stays on Clerk's current sign-up resource. No legacy OTP or
 * custom JWT endpoint is used here.
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { colors, spacing, radii, typography } from "@/theme";
import { useAuthStore } from "@/store/auth";
import { useSignUp } from "@clerk/expo";
import HovinWordmark from "@/components/HovinWordmark";

const RESEND_SECONDS = 60;

interface OtpParams {
  email: string;
  mode: "register";
  role?: string;
}

export default function OtpScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const params: OtpParams = route.params;

  const { isLoading: storeLoading, loadUser } = useAuthStore();
  const { signUp, fetchStatus: signUpFetchStatus } = useSignUp();
  const isLoading = storeLoading || signUpFetchStatus === "fetching";
  const [code, setCode] = useState("");
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [sending, setSending] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const resend = async () => {
    setSending(true);
    try {
      const sent = await signUp.verifications.sendEmailCode();
      if (sent.error) throw new Error(sent.error.message || "Could not send verification code");
      setSeconds(RESEND_SECONDS);
      Alert.alert("Code sent", `We sent a 6-digit code to ${params.email}`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not send code");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    resend();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (seconds <= 0) {
      if (timer.current) clearInterval(timer.current);
      return;
    }
    timer.current = setInterval(() => {
      setSeconds((s) => (s > 1 ? s - 1 : 0));
    }, 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [seconds <= 0, seconds]);

  const handleVerify = async () => {
    if (code.trim().length !== 6) {
      Alert.alert("Error", "Enter the 6-digit code");
      return;
    }
    try {
      const result = await signUp.verifications.verifyEmailCode({ code: code.trim() });
      if (result.error) throw new Error(result.error.message || "Invalid verification code");
      const finalized = await signUp.finalize();
      if (finalized.error) throw new Error(finalized.error.message || "Could not finish account setup");
      // Clerk session activation and token minting are asynchronous. Refresh
      // the tenant profile only after finalize so navigation cannot fall back
      // to the unauthenticated stack during that propagation window.
      await loadUser();
    } catch (err: any) {
      Alert.alert("Verification Failed", err.message || "Invalid code");
    }
  };

  const canResend = seconds <= 0 && !sending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <HovinWordmark size={28} />
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtext}>
            Enter the 6-digit code we sent to{`\n`}
            <Text style={styles.phone}>{params.email}</Text>
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Verification Code</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={(t) => setCode(t.replace(/[^\d]/g, "").slice(0, 6))}
            placeholder="• • • • • •"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />

          <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.buttonText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendRow}>
            {canResend ? (
              <TouchableOpacity onPress={resend} disabled={sending}>
                <Text style={styles.link}>Resend code</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.muted}>Resend in {seconds}s</Text>
            )}
          </View>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.linkMuted}>Use password instead</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, justifyContent: "center", padding: spacing.xl },
  header: { alignItems: "center", marginBottom: spacing.xxxl },
  logoWord: { fontSize: 28, fontWeight: "800", letterSpacing: 3, color: colors.text, fontFamily: "PlusJakartaSans_700Bold", marginBottom: spacing.sm },
  title: { ...typography.h2, color: colors.text, textAlign: "center" },
  subtext: { ...typography.body, color: colors.textSecondary, textAlign: "center", marginTop: spacing.sm, lineHeight: 22 },
  phone: { color: colors.primary, fontWeight: "600" },
  form: { gap: spacing.md },
  label: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.lg,
    color: colors.text,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 12,
  },
  button: { backgroundColor: colors.primary, borderRadius: radii.md, padding: spacing.lg, alignItems: "center", marginTop: spacing.md },
  buttonText: { color: colors.bg, fontWeight: "600", fontSize: 16 },
  resendRow: { alignItems: "center", marginTop: spacing.lg },
  link: { color: colors.primary, ...typography.bodySmall },
  linkMuted: { color: colors.textMuted, textAlign: "center", marginTop: spacing.lg, ...typography.bodySmall },
  muted: { color: colors.textMuted, ...typography.bodySmall },
});
