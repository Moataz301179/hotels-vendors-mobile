/**
 * ForgotPasswordScreen
 * Simple email-based password reset request.
 */

import React, { useState } from "react";
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
import { colors, spacing, radii, typography } from "@/theme";
import { useSignIn } from "@clerk/expo";

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"email" | "code" | "password" | "done">("email");
  const { signIn, fetchStatus } = useSignIn();

  const handleSendCode = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const started = await signIn.create({ identifier: email.trim().toLowerCase() });
      if (started.error) throw new Error(started.error.message || "Could not start password recovery");
      const sent = await signIn.resetPasswordEmailCode.sendCode();
      if (sent.error) throw new Error(sent.error.message || "Could not send the reset code");
      setStage("code");
    } catch (err: any) {
      Alert.alert("Could not send reset code", err.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.trim().length !== 6) {
      Alert.alert("Invalid code", "Enter the 6-digit code from your email.");
      return;
    }
    setLoading(true);
    try {
      const verified = await signIn.resetPasswordEmailCode.verifyCode({ code: code.trim() });
      if (verified.error) throw new Error(verified.error.message || "The code could not be verified");
      setStage("password");
    } catch (err: any) {
      Alert.alert("Could not verify code", err.message || "Check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (password.length < 15) {
      Alert.alert("Password too short", "Use at least 15 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match", "Enter the same new password in both fields.");
      return;
    }
    setLoading(true);
    try {
      const submitted = await signIn.resetPasswordEmailCode.submitPassword({ password });
      if (submitted.error) throw new Error(submitted.error.message || "Could not update the password");
      if (signIn.status === "complete") {
        const finalized = await signIn.finalize();
        if (finalized.error) throw new Error(finalized.error.message || "Password changed, but sign-in could not finish");
      }
      setStage("done");
    } catch (err: any) {
      Alert.alert("Could not change password", err.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (stage === "done") {
    return (
      <View style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.checkmark}>✓</Text>
          <Text style={styles.title}>Password updated</Text>
          <Text style={styles.subtitle}>
            Your password has been changed. Return to sign in with your new password.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{stage === "email" ? "Reset password" : stage === "code" ? "Verify your email" : "Choose a new password"}</Text>
          <Text style={styles.subtitle}>
            {stage === "email" && "Enter the email on your account. Clerk will send a verification code."}
            {stage === "code" && `Enter the 6-digit code sent to ${email}.`}
            {stage === "password" && "Choose a password that is at least 15 characters long."}
          </Text>
        </View>

        <View style={styles.form}>
          {stage === "email" && <>
            <Text style={styles.label}>Email address</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@hotel.com" placeholderTextColor={colors.textMuted} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" />
          </>}
          {stage === "code" && <>
            <Text style={styles.label}>Verification code</Text>
            <TextInput style={styles.input} value={code} onChangeText={setCode} placeholder="6-digit code" placeholderTextColor={colors.textMuted} keyboardType="number-pad" autoComplete="one-time-code" maxLength={6} />
            <TouchableOpacity onPress={handleSendCode} disabled={loading}>
              <Text style={styles.link}>Send another code</Text>
            </TouchableOpacity>
          </>}
          {stage === "password" && <>
            <Text style={styles.label}>New password</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="At least 15 characters" placeholderTextColor={colors.textMuted} secureTextEntry autoCapitalize="none" autoCorrect={false} />
            <Text style={styles.label}>Confirm new password</Text>
            <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter new password" placeholderTextColor={colors.textMuted} secureTextEntry autoCapitalize="none" autoCorrect={false} />
          </>}

          <TouchableOpacity style={styles.button} onPress={stage === "email" ? handleSendCode : stage === "code" ? handleVerifyCode : handleSetPassword} disabled={loading || fetchStatus === "fetching"}>
            {loading || fetchStatus === "fetching" ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.buttonText}>{stage === "email" ? "Send reset code" : stage === "code" ? "Verify code" : "Update password"}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.xxl,
  },
  checkmark: {
    fontSize: 48,
    color: colors.primary,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 22,
  },
  form: {
    gap: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
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
  buttonText: {
    color: colors.bg,
    fontWeight: "600",
    fontSize: 16,
  },
  link: {
    color: colors.primary,
    textAlign: "center",
    marginTop: spacing.lg,
    ...typography.bodySmall,
  },
});
