/**
 * OTP Login — enter mobile number to receive a code
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { colors, spacing, radii, typography } from "@/theme";
import { isValidEgyptianPhone, normalizePhone } from "@/utils/phone";
import PhoneInput from "@/components/PhoneInput";

export default function OtpLoginScreen({ navigation }: any) {
  const [phone, setPhone] = useState("");

  const handleSend = () => {
    if (!isValidEgyptianPhone(phone)) {
      Alert.alert("Invalid Number", "Enter a valid Egyptian mobile number, e.g. 0101 234 5678");
      return;
    }
    navigation.navigate("Otp", { mode: "login", phone: normalizePhone(phone) });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>HOVIN</Text>
          <Text style={styles.title}>Sign in with mobile</Text>
          <Text style={styles.subtext}>
            We'll text you a 6-digit code. Your number must be registered to the
            same account.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Mobile Number</Text>
          <PhoneInput value={phone} onChangeText={setPhone} />

          <TouchableOpacity style={styles.button} onPress={handleSend}>
            <Text style={styles.buttonText}>Send Code</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>Back to sign in</Text>
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
  form: { gap: spacing.md },
  label: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs },
  input: { backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.lg, color: colors.text, fontSize: 18 },
  button: { backgroundColor: colors.primary, borderRadius: radii.md, padding: spacing.lg, alignItems: "center", marginTop: spacing.md },
  buttonText: { color: colors.bg, fontWeight: "600", fontSize: 16 },
  link: { color: colors.primary, textAlign: "center", marginTop: spacing.lg, ...typography.bodySmall },
});
