/**
 * OTP Screen — verify mobile number
 *
 * mode "register": calls register() with the account profile + verified code.
 * mode "login": calls otpLogin() with the code.
 * On success the auth store flips isAuthenticated and navigation swaps to the
 * main tabs automatically.
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
import { normalizePhone } from "@/utils/phone";

const RESEND_SECONDS = 60;

interface OtpParams {
  phone: string;
  mode: "login" | "register";
  name?: string;
  email?: string;
  password?: string;
  role?: string;
}

export default function OtpScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const params: OtpParams = route.params;
  const phone = normalizePhone(params.phone);

  const { register, otpLogin, sendOtp, isLoading } = useAuthStore();
  const [code, setCode] = useState("");
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [sending, setSending] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const resend = async () => {
    setSending(true);
    try {
      await sendOtp(phone);
      setSeconds(RESEND_SECONDS);
      Alert.alert("Code sent", `We sent a 6-digit code to ${phone}`);
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
      if (params.mode === "register") {
        await register({
          name: params.name || "",
          role: params.role || "HOTEL",
          password: params.password || "",
          phone,
          otpCode: code.trim(),
          email: params.email || undefined,
        });
      } else {
        await otpLogin(phone, code.trim());
      }
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
          <Text style={styles.logo}>HOVIN</Text>
          <Text style={styles.title}>Verify your number</Text>
          <Text style={styles.subtext}>
            Enter the 6-digit code we sent to{`\n`}
            <Text style={styles.phone}>{phone}</Text>
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
  logo: { ...typography.h1, color: colors.primary, fontSize: 28, letterSpacing: 6, marginBottom: spacing.lg },
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
